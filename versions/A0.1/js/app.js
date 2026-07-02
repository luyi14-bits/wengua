var YAO_LABELS = ["初", "二", "三", "四", "五", "上"];

var XIANTIAN_TRIGRAM = [null, '☰','☱','☲','☳','☴','☵','☶','☷'];

var TRIGRAM_TO_BINARY = {
    '☰':'111','☱':'110','☲':'101','☳':'100',
    '☴':'011','☵':'010','☶':'001','☷':'000'
};

var TRIGRAM_WUXING = {
    '☰':'金','☱':'金','☲':'火','☳':'木',
    '☴':'木','☵':'水','☶':'土','☷':'土'
};

var WUXING_SHENG = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
var WUXING_KE   = { '木':'土','土':'水','水':'火','火':'金','金':'木' };

var currentMode = 'tongqian';
var savedTongqianResult = null;
var savedMeihuaResult = null;

function castOnce() {
    const coins = [Math.random(), Math.random(), Math.random()];
    const heads = coins.filter(c => c >= 0.5).length;
    const type = (heads === 2 || heads === 0) ? 'yang' : 'yin';
    const changing = (heads === 3 || heads === 0);
    return { type, changing, value: (type === 'yang' ? 1 : 0) };
}

function findGua(yaoLines) {
    const binary = yaoLines.map(y => y.value).join('');
    return GUA_BY_BINARY[binary] || null;
}

function getBianGua(benGua, yaoLines) {
    const changingIndices = [];
    const newBinary = yaoLines.map((y, i) => {
        if (y.changing) { changingIndices.push(i); return 1 - y.value; }
        return y.value;
    }).join('');
    if (changingIndices.length === 0) return { gua: null, indices: [] };
    return { gua: GUA_BY_BINARY[newBinary], indices: changingIndices };
}

function getInterpretationFocus(benGua, bianGua, changingIndices) {
    const count = changingIndices.length;
    const result = { type: '', primary: '', secondary: '' };

    if (count === 0) {
        result.type = 'ben-gua-judgement';
        result.primary = benGua.judgement;
    } else if (count === 1) {
        const idx = changingIndices[0];
        result.type = 'changing-yao';
        result.primary = benGua.lines[idx];
    } else if (count === 2) {
        const maxIdx = Math.max(...changingIndices);
        const minIdx = Math.min(...changingIndices);
        result.type = 'two-changing-yao';
        result.primary = benGua.lines[maxIdx];
        result.secondary = benGua.lines[minIdx];
    } else if (count === 3) {
        result.type = 'three-changing-yao';
        result.primary = benGua.judgement;
        if (bianGua) result.secondary = bianGua.judgement;
    } else if (count === 4) {
        const unchanged = [0, 1, 2, 3, 4, 5].filter(i => !changingIndices.includes(i));
        const unchangedMin = Math.min(...unchanged);
        const unchangedMax = Math.max(...unchanged);
        result.type = 'four-changing-yao';
        if (bianGua) {
            result.primary = bianGua.lines[unchangedMin];
            result.secondary = bianGua.lines[unchangedMax];
        }
    } else if (count === 5) {
        const unchangedIdx = [0, 1, 2, 3, 4, 5].find(i => !changingIndices.includes(i));
        result.type = 'five-changing-yao';
        if (bianGua && unchangedIdx !== undefined) {
            result.primary = bianGua.lines[unchangedIdx];
        }
    } else if (count === 6) {
        result.type = 'six-changing-yao';
        if (benGua.id === 1 && benGua.yong) {
            result.primary = benGua.yong;
        } else if (benGua.id === 2 && benGua.yong) {
            result.primary = benGua.yong;
        } else {
            if (bianGua) result.primary = bianGua.judgement;
            if (!result.primary) result.primary = benGua.judgement || '';
        }
    }

    return result;
}

function getYaoLabel(index, type) {
    if (index < 0 || index > 5) {
        console.warn(`[getYaoLabel] invalid index: ${index}`);
        return '';
    }
    const pos = YAO_LABELS[index];
    if (index === 5) {
        return type === 'yang' ? '上九' : '上六';
    }
    if (index === 0) {
        return type === 'yang' ? '初九' : '初六';
    }
    return type === 'yang' ? '九' + pos : '六' + pos;
}

function appendTextWithLabel(parent, label, text) {
    const strong = document.createElement('strong');
    strong.textContent = label;
    parent.appendChild(strong);
    parent.appendChild(document.createTextNode(text));
}

function renderResult(result) {
    const nameEl = document.getElementById('gua-name');
    const symbolEl = document.getElementById('gua-symbol');
    const interpEl = document.getElementById('gua-interpretation');

    const { benGua, bianGua, changingIndices, focus, yaoLines } = result;

    nameEl.textContent = `${benGua.name} ${benGua.symbol}`;
    symbolEl.textContent = benGua.symbol;

    interpEl.textContent = '';
    const fragment = document.createDocumentFragment();

    const judgement = document.createElement('div');
    judgement.className = 'gua-judgement';
    appendTextWithLabel(judgement, '卦辞：', benGua.judgement);
    fragment.appendChild(judgement);

    const yaoList = document.createElement('div');
    yaoList.className = 'yao-lines-list';
    for (let i = 5; i >= 0; i--) {
        const line = benGua.lines[i];
        const isChanging = yaoLines[i].changing;
        const item = document.createElement('div');
        item.className = isChanging ? 'yao-line-item changing' : 'yao-line-item';
        item.textContent = line;
        yaoList.appendChild(item);
    }
    fragment.appendChild(yaoList);

    if (bianGua) {
        const card = document.createElement('div');
        card.className = 'bian-gua-card';

        const header = document.createElement('div');
        header.className = 'bian-gua-header';
        header.textContent = `→ 变卦：${bianGua.name} ${bianGua.symbol}`;
        card.appendChild(header);

        const bgJudgement = document.createElement('div');
        bgJudgement.className = 'bian-gua-judgement';
        appendTextWithLabel(bgJudgement, '卦辞：', bianGua.judgement);
        card.appendChild(bgJudgement);

        fragment.appendChild(card);
    }

    const focusDiv = document.createElement('div');
    focusDiv.className = 'gua-focus';

    const focusHeader = document.createElement('div');
    focusHeader.className = 'gua-focus-header';
    focusHeader.textContent = '⚡ 解读焦点';
    focusDiv.appendChild(focusHeader);

    const primary = document.createElement('div');
    primary.className = 'gua-focus-primary';
    appendTextWithLabel(primary, '主看：', focus.primary);
    focusDiv.appendChild(primary);

    if (focus.secondary) {
        const secondary = document.createElement('div');
        secondary.className = 'gua-focus-secondary';
        appendTextWithLabel(secondary, '次看：', focus.secondary);
        focusDiv.appendChild(secondary);
    }

    fragment.appendChild(focusDiv);
    interpEl.appendChild(fragment);
}

function numberToTrigram(n) {
    let num = n % 8;
    if (num === 0) num = 8;
    return { symbol: XIANTIAN_TRIGRAM[num], xiantianNum: num };
}

function meihuaCast(num1, num2, num3) {
    const upper = numberToTrigram(num1);
    const lower = numberToTrigram(num2);
    const dongYao = num3 % 6 === 0 ? 6 : num3 % 6;
    const binary = TRIGRAM_TO_BINARY[upper.symbol] + TRIGRAM_TO_BINARY[lower.symbol];
    const benGua = GUA_BY_BINARY[binary];
    return { upper, lower, dongYao, benGua };
}

function calcHuGua(benGua) {
    const b = benGua.binary;
    const outerBinary = b[1] + b[2] + b[3];
    const innerBinary = b[2] + b[3] + b[4];
    return GUA_BY_BINARY[outerBinary + innerBinary];
}

function calcTiYong(upper, lower, dongYao) {
    if (dongYao >= 1 && dongYao <= 3) {
        return { tiGua: upper, yongGua: lower };
    } else {
        return { tiGua: lower, yongGua: upper };
    }
}

function judgeShengKe(tiWuxing, yongWuxing) {
    if (WUXING_SHENG[yongWuxing] === tiWuxing) return { relation: '用生体', judgment: '大吉', level: 5 };
    if (tiWuxing === yongWuxing)               return { relation: '体用比和', judgment: '吉', level: 4 };
    if (WUXING_KE[tiWuxing] === yongWuxing)    return { relation: '体克用', judgment: '小吉', level: 3 };
    if (WUXING_SHENG[tiWuxing] === yongWuxing) return { relation: '体生用', judgment: '泄气', level: 2 };
    if (WUXING_KE[yongWuxing] === tiWuxing)    return { relation: '用克体', judgment: '凶', level: 1 };
    return { relation: '未知', judgment: '', level: 0 };
}

function renderMeihuaResult(result) {
    const nameEl = document.getElementById('gua-name');
    const symbolEl = document.getElementById('gua-symbol');
    const interpEl = document.getElementById('gua-interpretation');

    const { benGua, huGua, bianGua, tiYong, shengke, upper, lower, dongYao, focus } = result;

    nameEl.textContent = `${benGua.name} ${benGua.symbol}`;
    symbolEl.textContent = '';

    interpEl.textContent = '';
    const fragment = document.createDocumentFragment();

    const benCard = document.createElement('div');
    benCard.className = 'meihua-card';
    const benHeader = document.createElement('div');
    benHeader.className = 'card-header';
    benHeader.textContent = `本卦：${benGua.name} ${benGua.symbol}`;
    benCard.appendChild(benHeader);
    const benBody = document.createElement('div');
    benBody.className = 'card-body';
    const source = document.createElement('div');
    source.className = 'meihua-source';
    source.textContent = `数理来源：上卦=${upper.xiantianNum}(${upper.symbol}) × 下卦=${lower.xiantianNum}(${lower.symbol})，动爻=${dongYao}`;
    benBody.appendChild(source);
    const benJudgement = document.createElement('div');
    benJudgement.className = 'gua-judgement';
    appendTextWithLabel(benJudgement, '卦辞：', benGua.judgement);
    benBody.appendChild(benJudgement);
    benCard.appendChild(benBody);
    fragment.appendChild(benCard);

    const huCard = document.createElement('div');
    huCard.className = 'meihua-card';
    const huHeader = document.createElement('div');
    huHeader.className = 'card-header';
    huHeader.textContent = `互卦：${huGua.name} ${huGua.symbol}`;
    huCard.appendChild(huHeader);
    const huBody = document.createElement('div');
    huBody.className = 'card-body';
    huBody.textContent = '揭示发展过程中的中间状态';
    huCard.appendChild(huBody);
    fragment.appendChild(huCard);

    if (bianGua) {
        const card = document.createElement('div');
        card.className = 'bian-gua-card';
        const header = document.createElement('div');
        header.className = 'bian-gua-header';
        header.textContent = `→ 变卦：${bianGua.name} ${bianGua.symbol}`;
        card.appendChild(header);
        const bgJudgement = document.createElement('div');
        bgJudgement.className = 'bian-gua-judgement';
        appendTextWithLabel(bgJudgement, '卦辞：', bianGua.judgement);
        card.appendChild(bgJudgement);
        fragment.appendChild(card);
    }

    const levelClass = `tiyong-level-${shengke.level}`;
    const tiyongCard = document.createElement('div');
    tiyongCard.className = `tiyong-card ${levelClass}`;
    const tiyongHeader = document.createElement('div');
    tiyongHeader.className = 'card-header';
    const icon = shengke.level >= 5 ? '✅' : shengke.level >= 4 ? '✅' : shengke.level >= 3 ? '✔️' : shengke.level >= 2 ? '⚠️' : '❌';
    tiyongHeader.textContent = `${icon} 体用生克 — ${shengke.judgment}`;
    tiyongCard.appendChild(tiyongHeader);
    const tiyongBody = document.createElement('div');
    tiyongBody.className = 'card-body';
    tiyongBody.textContent = `体卦=${tiYong.tiGua.symbol} ${TRIGRAM_WUXING[tiYong.tiGua.symbol]} / 用卦=${tiYong.yongGua.symbol} ${TRIGRAM_WUXING[tiYong.yongGua.symbol]} | ${shengke.relation}`;
    tiyongCard.appendChild(tiyongBody);
    fragment.appendChild(tiyongCard);

    const focusDiv = document.createElement('div');
    focusDiv.className = 'gua-focus';
    const focusHeader = document.createElement('div');
    focusHeader.className = 'gua-focus-header';
    focusHeader.textContent = '⚡ 解读焦点';
    focusDiv.appendChild(focusHeader);
    const primary = document.createElement('div');
    primary.className = 'gua-focus-primary';
    appendTextWithLabel(primary, '主看：', focus.primary);
    focusDiv.appendChild(primary);
    if (focus.secondary) {
        const secondary = document.createElement('div');
        secondary.className = 'gua-focus-secondary';
        appendTextWithLabel(secondary, '次看：', focus.secondary);
        focusDiv.appendChild(secondary);
    }
    fragment.appendChild(focusDiv);

    interpEl.appendChild(fragment);
}

function switchMode(mode) {
    currentMode = mode;

    const tabTongqian = document.getElementById('tab-tongqian');
    const tabMeihua = document.getElementById('tab-meihua');
    const controls = document.getElementById('controls');
    const meihuaControls = document.getElementById('meihua-controls');
    const guaDisplay = document.getElementById('gua-display');
    const resultDiv = document.getElementById('result');
    const nameEl = document.getElementById('gua-name');
    const symbolEl = document.getElementById('gua-symbol');
    const interpEl = document.getElementById('gua-interpretation');

    if (mode === 'tongqian') {
        tabTongqian.classList.add('active');
        tabMeihua.classList.remove('active');
        controls.style.display = '';
        meihuaControls.style.display = 'none';
        guaDisplay.classList.remove('meihua-mode');
        guaDisplay.querySelectorAll('.meihua-trigram').forEach(el => el.remove());
        const placeholder = guaDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = '';

        if (savedTongqianResult) {
            resultDiv.classList.remove('hidden');
            renderResult(savedTongqianResult);
        } else {
            resultDiv.classList.add('hidden');
        }
    } else {
        tabTongqian.classList.remove('active');
        tabMeihua.classList.add('active');
        controls.style.display = 'none';
        meihuaControls.style.display = '';
        guaDisplay.querySelectorAll('.yao').forEach(el => el.remove());
        const placeholder = guaDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = 'none';
        guaDisplay.classList.remove('meihua-mode');
        resultDiv.classList.add('hidden');
        nameEl.textContent = '';
        symbolEl.textContent = '';
        interpEl.textContent = '';
    }
}

function validateMeihuaInput() {
    const inputs = [
        document.getElementById('input-num1'),
        document.getElementById('input-num2'),
        document.getElementById('input-num3')
    ];
    let valid = true;

    inputs.forEach(inp => {
        const val = inp.value.trim();
        inp.classList.remove('error');
        if (val === '') {
            inp.classList.add('error');
            valid = false;
            return;
        }
        const num = Number(val);
        if (!Number.isInteger(num) || num < 1 || num > 9999 || val.includes('.')) {
            inp.classList.add('error');
            valid = false;
        }
    });

    return valid;
}

function doMeihuaCast() {
    if (!validateMeihuaInput()) return;

    const num1 = parseInt(document.getElementById('input-num1').value, 10);
    const num2 = parseInt(document.getElementById('input-num2').value, 10);
    const num3 = parseInt(document.getElementById('input-num3').value, 10);

    const { upper, lower, dongYao, benGua } = meihuaCast(num1, num2, num3);

    const huGua = calcHuGua(benGua);

    const yaoLines = benGua.binary.split('').map((bit, i) => ({
        value: parseInt(bit, 10),
        type: bit === '1' ? 'yang' : 'yin',
        changing: (i === (dongYao - 1))
    }));
    const bianGuaResult = getBianGua(benGua, yaoLines);

    const tiYong = calcTiYong(upper, lower, dongYao);
    const tiWx = TRIGRAM_WUXING[tiYong.tiGua.symbol];
    const yongWx = TRIGRAM_WUXING[tiYong.yongGua.symbol];
    const shengke = judgeShengKe(tiWx, yongWx);

    const changingIndices = bianGuaResult.indices;
    const focus = getInterpretationFocus(benGua, bianGuaResult.gua, changingIndices);

    const result = { benGua, huGua, bianGua: bianGuaResult.gua, tiYong, shengke, upper, lower, dongYao, focus };
    savedMeihuaResult = result;

    const guaDisplay = document.getElementById('gua-display');
    guaDisplay.querySelectorAll('.yao, .meihua-trigram').forEach(el => el.remove());
    guaDisplay.classList.add('meihua-mode');
    const placeholder = guaDisplay.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const upperSpan = document.createElement('span');
    upperSpan.className = 'meihua-trigram';
    upperSpan.textContent = upper.symbol;
    guaDisplay.appendChild(upperSpan);

    const lowerSpan = document.createElement('span');
    lowerSpan.className = 'meihua-trigram';
    lowerSpan.textContent = lower.symbol;
    guaDisplay.appendChild(lowerSpan);

    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('hidden');
    renderMeihuaResult(result);
}

document.addEventListener("DOMContentLoaded", () => {
    const btnCast = document.getElementById("btn-cast");
    const resultDiv = document.getElementById("result");
    const guaDisplay = document.getElementById("gua-display");
    const tabTongqian = document.getElementById('tab-tongqian');
    const tabMeihua = document.getElementById('tab-meihua');
    const btnMeihuaCast = document.getElementById('btn-meihua-cast');
    const btnRandom = document.getElementById('btn-meihua-random');
    const btnTime = document.getElementById('btn-meihua-time');
    let isCasting = false;

    btnCast.addEventListener("click", async () => {
        if (isCasting) return;
        isCasting = true;
        btnCast.disabled = true;
        btnCast.textContent = "起卦中…";

        document.querySelectorAll('#gua-display .yao').forEach(el => el.remove());
        const placeholder = guaDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = 'none';

        resultDiv.classList.add('hidden');

        const yaoLines = [];
        for (let i = 0; i < 6; i++) {
            const yao = castOnce();
            yaoLines.push(yao);
            Animation.drawGua(guaDisplay, yao);
            await new Promise(r => setTimeout(r, 500));
        }

        const benGua = findGua(yaoLines);
        const bianGuaResult = getBianGua(benGua, yaoLines);
        const focus = getInterpretationFocus(benGua, bianGuaResult.gua, bianGuaResult.indices);

        const result = {
            benGua,
            bianGua: bianGuaResult.gua,
            changingIndices: bianGuaResult.indices,
            focus,
            yaoLines
        };
        savedTongqianResult = result;

        renderResult(result);
        resultDiv.classList.remove('hidden');

        btnCast.disabled = false;
        btnCast.textContent = "再掷一卦";
        isCasting = false;
    });

    tabTongqian.addEventListener('click', () => switchMode('tongqian'));
    tabMeihua.addEventListener('click', () => switchMode('meihua'));

    btnMeihuaCast.addEventListener('click', doMeihuaCast);

    btnRandom.addEventListener('click', () => {
        const n1 = Math.floor(Math.random() * 999) + 1;
        const n2 = Math.floor(Math.random() * 999) + 1;
        const n3 = Math.floor(Math.random() * 999) + 1;
        document.getElementById('input-num1').value = n1;
        document.getElementById('input-num2').value = n2;
        document.getElementById('input-num3').value = n3;
        document.querySelectorAll('.meihua-input-group input').forEach(inp => inp.classList.remove('error'));
        doMeihuaCast();
    });

    btnTime.addEventListener('click', () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        const shichen = Math.floor((hour + 1) / 2) % 12 || 12;

        const n1 = (year + month + day) % 8;
        const n2 = (year + month + day + shichen) % 8;
        const n3 = (year + month + day + shichen) % 6;

        document.getElementById('input-num1').value = n1 === 0 ? 8 : n1;
        document.getElementById('input-num2').value = n2 === 0 ? 8 : n2;
        document.getElementById('input-num3').value = n3 === 0 ? 6 : n3;
        document.querySelectorAll('.meihua-input-group input').forEach(inp => inp.classList.remove('error'));
        doMeihuaCast();
    });

    document.querySelectorAll('.meihua-input-group input').forEach(inp => {
        inp.addEventListener('input', () => inp.classList.remove('error'));
    });
});
