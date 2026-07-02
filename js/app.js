/**
 * AskTheOracle — 主逻辑
 *
 * Copyright (C) 2026 天问 (AskTheOracle)
 * Licensed under GNU AGPL v3.0
 */

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
var savedNameResult = null;

// [FIX B3] COMPOUND_SURNAMES 去重：移除 司马/宇文/慕容/诸葛/欧阳/梁丘 重复条目
var COMPOUND_SURNAMES = {
    '欧阳':1,'司马':1,'上官':1,'诸葛':1,'夏侯':1,'慕容':1,'宇文':1,
    '端木':1,'皇甫':1,'令狐':1,'尉迟':1,'公孙':1,'长孙':1,'轩辕':1,
    '申屠':1,'独孤':1,'司徒':1,'司空':1,'司寇':1,'鲜于':1,
    '淳于':1,'钟离':1,'万俟':1,'单于':1,'沮渠':1,'拓跋':1,
    '赫连':1,'呼延':1,'闾丘':1,'梁丘':1,'左丘':1,'东门':1,
    '西门':1,'南宫':1,'第五':1,'公羊':1,'公冶':1,'宗政':1,'濮阳':1,
    '太史':1,'叔孙':1,'仲孙':1,'闻人':1,'东方':1,
    '百里':1,'微生':1,'即墨':1,'公西':1,'颛孙':1,'子车':1
};

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
    const tabName = document.getElementById('tab-name');
    const controls = document.getElementById('controls');
    const meihuaControls = document.getElementById('meihua-controls');
    const nameControls = document.getElementById('name-controls');
    const guaDisplay = document.getElementById('gua-display');
    const resultDiv = document.getElementById('result');
    const nameEl = document.getElementById('gua-name');
    const symbolEl = document.getElementById('gua-symbol');
    const interpEl = document.getElementById('gua-interpretation');

    if (mode === 'tongqian') {
        tabTongqian.classList.add('active');
        tabMeihua.classList.remove('active');
        tabName.classList.remove('active');
        controls.style.display = '';
        // [FIX B1] 用 classList 管理 hidden，配合 CSS #id.hidden 复合选择器 (特异性 0,1,1,0 > 0,1,0,0)
        meihuaControls.classList.add('hidden');
        nameControls.classList.add('hidden');
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
    } else if (mode === 'meihua') {
        tabTongqian.classList.remove('active');
        tabMeihua.classList.add('active');
        tabName.classList.remove('active');
        controls.style.display = 'none';
        // [FIX B1] 同上
        meihuaControls.classList.remove('hidden');
        nameControls.classList.add('hidden');
        // [FIX C1] 同时清理 .coin-flip
        guaDisplay.querySelectorAll('.yao, .coin-flip').forEach(el => el.remove());
        document.querySelectorAll('#gua-display .meihua-trigram').forEach(el => el.remove());
        const placeholder = guaDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = 'none';
        guaDisplay.classList.remove('meihua-mode');
        resultDiv.classList.add('hidden');
        nameEl.textContent = '';
        symbolEl.textContent = '';
        interpEl.textContent = '';

        if (savedMeihuaResult) {
            resultDiv.classList.remove('hidden');
            renderMeihuaResult(savedMeihuaResult);
        }
    } else {
        tabTongqian.classList.remove('active');
        tabMeihua.classList.remove('active');
        tabName.classList.add('active');
        controls.style.display = 'none';
        // [FIX B1] 同上
        meihuaControls.classList.add('hidden');
        nameControls.classList.remove('hidden');
        // [FIX C1] 同时清理 .coin-flip
        guaDisplay.querySelectorAll('.yao, .coin-flip, .meihua-trigram').forEach(el => el.remove());
        guaDisplay.classList.remove('meihua-mode');
        const placeholder = guaDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = '';
        resultDiv.classList.add('hidden');
        nameEl.textContent = '';
        symbolEl.textContent = '';
        interpEl.textContent = '';

        if (savedNameResult) {
            resultDiv.classList.remove('hidden');
            renderNameResult(savedNameResult);
        }
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
    // [FIX C1] 同时清理 .coin-flip
    guaDisplay.querySelectorAll('.yao, .coin-flip, .meihua-trigram').forEach(el => el.remove());
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

// --- 姓名起卦 ---

function parseName(name) {
    name = name.trim();
    if (name.length === 0) return null;
    if (name.length === 2) {
        return { type: 'single-single', surname: [name[0]], given: [name[1]] };
    }
    if (name.length === 3) {
        if (COMPOUND_SURNAMES[name.substring(0, 2)]) {
            return { type: 'compound-single', surname: [name[0], name[1]], given: [name[2]] };
        }
        return { type: 'single-double', surname: [name[0]], given: [name[1], name[2]] };
    }
    if (name.length >= 4) {
        if (COMPOUND_SURNAMES[name.substring(0, 2)]) {
            return { type: 'compound-double', surname: [name[0], name[1]], given: name.substring(2).split('') };
        }
        // [FIX C2] 4+字非复姓：首字为姓，其余为名（而非前2字当复姓）
        return { type: 'single-triple', surname: [name[0]], given: name.substring(1).split('') };
    }
    return null;
}

function calcNameStrokes(parsed) {
    var surnameChars = parsed.surname.map(function (c) {
        return { char: c, stroke: STROKE_MAP.get(c), found: STROKE_MAP.get(c) !== null };
    });
    var givenChars = parsed.given.map(function (c) {
        return { char: c, stroke: STROKE_MAP.get(c), found: STROKE_MAP.get(c) !== null };
    });
    var surnameStrokes = surnameChars.reduce(function (s, x) { return s + (x.stroke || 0); }, 0);
    var givenStrokes = givenChars.reduce(function (s, x) { return s + (x.stroke || 0); }, 0);
    var totalStrokes = surnameStrokes + givenStrokes;
    var missing = surnameChars.concat(givenChars).filter(function (x) { return !x.found; });
    return { surnameChars: surnameChars, givenChars: givenChars, surnameStrokes: surnameStrokes, givenStrokes: givenStrokes, totalStrokes: totalStrokes, missing: missing };
}

function nameCast(name) {
    var parsed = parseName(name);
    if (!parsed) return null;

    var strokes = calcNameStrokes(parsed);
    if (strokes.missing.length > 0 || strokes.surnameStrokes === 0 || strokes.givenStrokes === 0) return null;

    var num1 = strokes.surnameStrokes;
    var num2 = strokes.givenStrokes;
    var num3 = strokes.totalStrokes;

    var { upper, lower, dongYao, benGua } = meihuaCast(num1, num2, num3);
    var huGua = calcHuGua(benGua);

    var yaoLines = benGua.binary.split('').map(function (bit, i) {
        return { value: parseInt(bit, 10), type: bit === '1' ? 'yang' : 'yin', changing: (i === (dongYao - 1)) };
    });
    var bianGuaResult = getBianGua(benGua, yaoLines);

    var tiYong = calcTiYong(upper, lower, dongYao);
    var tiWx = TRIGRAM_WUXING[tiYong.tiGua.symbol];
    var yongWx = TRIGRAM_WUXING[tiYong.yongGua.symbol];
    var shengke = judgeShengKe(tiWx, yongWx);

    var changingIndices = bianGuaResult.indices;
    var focus = getInterpretationFocus(benGua, bianGuaResult.gua, changingIndices);

    return {
        parsed: parsed,
        strokes: strokes,
        benGua: benGua,
        huGua: huGua,
        bianGua: bianGuaResult.gua,
        tiYong: tiYong,
        shengke: shengke,
        upper: upper,
        lower: lower,
        dongYao: dongYao,
        focus: focus
    };
}

function renderNameResult(result) {
    var nameEl = document.getElementById('gua-name');
    var symbolEl = document.getElementById('gua-symbol');
    var interpEl = document.getElementById('gua-interpretation');

    var { parsed, strokes, benGua, huGua, bianGua, tiYong, shengke, upper, lower, dongYao, focus } = result;

    nameEl.textContent = benGua.name + ' ' + benGua.symbol;
    symbolEl.textContent = '';

    interpEl.textContent = '';
    var fragment = document.createDocumentFragment();

    // [FIX F-05] 笔画明细使用 createElement + textContent 替代 innerHTML，防止 DOM XSS
    var detailDiv = document.createElement('div');
    detailDiv.className = 'stroke-detail';
    var strokeEntries = [];
    strokes.surnameChars.concat(strokes.givenChars).forEach(function (x) {
        var span = document.createElement('span');
        span.className = 'stroke-char';
        var charText = document.createTextNode(x.char);
        span.appendChild(charText);
        var arrow = document.createTextNode('→');
        span.appendChild(arrow);
        var numSpan = document.createElement('span');
        numSpan.className = 'stroke-num';
        numSpan.textContent = x.stroke;
        span.appendChild(numSpan);
        var hua = document.createTextNode('画');
        span.appendChild(hua);
        strokeEntries.push(span);
    });
    strokeEntries.forEach(function (s, i) {
        if (i > 0) {
            detailDiv.appendChild(document.createTextNode(' / '));
        }
        detailDiv.appendChild(s);
    });
    var br = document.createElement('br');
    detailDiv.appendChild(br);
    var sumSpan = document.createElement('span');
    sumSpan.className = 'stroke-sum';
    sumSpan.textContent = '姓' + strokes.surnameStrokes + '画 + 名' + strokes.givenStrokes + '画 = ' + strokes.totalStrokes + '画，动在第' + dongYao + '爻';
    detailDiv.appendChild(sumSpan);
    fragment.appendChild(detailDiv);

    // 本卦卡片
    var benCard = document.createElement('div');
    benCard.className = 'meihua-card';
    var benHeader = document.createElement('div');
    benHeader.className = 'card-header';
    benHeader.textContent = '本卦：' + benGua.name + ' ' + benGua.symbol;
    benCard.appendChild(benHeader);
    var benBody = document.createElement('div');
    benBody.className = 'card-body';
    var benJudgement = document.createElement('div');
    var strong1 = document.createElement('strong');
    strong1.textContent = '卦辞：';
    benJudgement.appendChild(strong1);
    benJudgement.appendChild(document.createTextNode(benGua.judgement));
    benBody.appendChild(benJudgement);
    benCard.appendChild(benBody);
    fragment.appendChild(benCard);

    // 互卦卡片
    var huCard = document.createElement('div');
    huCard.className = 'meihua-card';
    var huHeader = document.createElement('div');
    huHeader.className = 'card-header';
    huHeader.textContent = '互卦：' + huGua.name + ' ' + huGua.symbol;
    huCard.appendChild(huHeader);
    var huBody = document.createElement('div');
    huBody.className = 'card-body';
    huBody.textContent = '揭示发展过程中的中间状态';
    huCard.appendChild(huBody);
    fragment.appendChild(huCard);

    // 变卦卡片
    if (bianGua) {
        var bCard = document.createElement('div');
        bCard.className = 'bian-gua-card';
        var bHeader = document.createElement('div');
        bHeader.className = 'bian-gua-header';
        bHeader.textContent = '→ 变卦：' + bianGua.name + ' ' + bianGua.symbol;
        bCard.appendChild(bHeader);
        var bJudgement = document.createElement('div');
        bJudgement.className = 'bian-gua-judgement';
        var strong2 = document.createElement('strong');
        strong2.textContent = '卦辞：';
        bJudgement.appendChild(strong2);
        bJudgement.appendChild(document.createTextNode(bianGua.judgement));
        bCard.appendChild(bJudgement);
        fragment.appendChild(bCard);
    }

    // 体用生克卡片
    var levelClass = 'tiyong-level-' + shengke.level;
    var tiyongCard = document.createElement('div');
    tiyongCard.className = 'tiyong-card ' + levelClass;
    var tiyongHeader = document.createElement('div');
    tiyongHeader.className = 'card-header';
    var icon = shengke.level >= 5 ? '✅' : shengke.level >= 4 ? '✅' : shengke.level >= 3 ? '✔️' : shengke.level >= 2 ? '⚠️' : '❌';
    tiyongHeader.textContent = icon + ' 体用生克 — ' + shengke.judgment;
    tiyongCard.appendChild(tiyongHeader);
    var tiyongBody = document.createElement('div');
    tiyongBody.className = 'card-body';
    tiyongBody.textContent = '体卦=' + tiYong.tiGua.symbol + ' ' + TRIGRAM_WUXING[tiYong.tiGua.symbol] + ' / 用卦=' + tiYong.yongGua.symbol + ' ' + TRIGRAM_WUXING[tiYong.yongGua.symbol] + ' | ' + shengke.relation;
    tiyongCard.appendChild(tiyongBody);
    fragment.appendChild(tiyongCard);

    // 命名评价卡片
    var nameEval = document.createElement('div');
    nameEval.className = 'name-eval-card ' + levelClass;
    var evalHeader = document.createElement('div');
    evalHeader.className = 'card-header';
    var evalIcon = shengke.level >= 5 ? '✅' : shengke.level >= 4 ? '✅' : shengke.level >= 3 ? '✔️' : shengke.level >= 2 ? '⚠️' : '❌';
    var evalLabel = shengke.level >= 5 ? '大吉·旺命名' : shengke.level >= 4 ? '吉·佳命名' : shengke.level >= 3 ? '平·中命名' : shengke.level >= 2 ? '泄·弱命名' : '凶·阻命名';
    evalHeader.textContent = evalIcon + ' 命名评价 — ' + evalLabel;
    nameEval.appendChild(evalHeader);
    var evalBody = document.createElement('div');
    evalBody.className = 'card-body';
    var evalTexts = {
        5: '这名字旺你，对命主有强大助益，名如其人气势如虹。',
        4: '这名字不错，内外和谐，与命主相得益彰。',
        3: '这名字尚可，虽有压力但可转化为动力。',
        2: '这名字对命主有所损耗，付出较多但收获有限。',
        1: '这名字给命主带来阻力，建议慎重考虑改名。'
    };
    evalBody.textContent = evalTexts[shengke.level] || '';
    nameEval.appendChild(evalBody);
    fragment.appendChild(nameEval);

    // 焦点解读
    var focusDiv = document.createElement('div');
    focusDiv.className = 'gua-focus';
    var focusHeader = document.createElement('div');
    focusHeader.className = 'gua-focus-header';
    focusHeader.textContent = '⚡ 解读焦点';
    focusDiv.appendChild(focusHeader);
    var primary = document.createElement('div');
    primary.className = 'gua-focus-primary';
    var strongF = document.createElement('strong');
    strongF.textContent = '主看：';
    primary.appendChild(strongF);
    primary.appendChild(document.createTextNode(focus.primary));
    focusDiv.appendChild(primary);
    if (focus.secondary) {
        var secondary = document.createElement('div');
        secondary.className = 'gua-focus-secondary';
        var strongS = document.createElement('strong');
        strongS.textContent = '次看：';
        secondary.appendChild(strongS);
        secondary.appendChild(document.createTextNode(focus.secondary));
        focusDiv.appendChild(secondary);
    }
    fragment.appendChild(focusDiv);

    interpEl.appendChild(fragment);
}

function doNameCast() {
    var input = document.getElementById('input-name');
    var name = input.value.trim();

    // [FIX B4] 用 .error class 替代 inline borderColor，与梅花输入验证方式统一
    input.classList.remove('error');

    if (name.length < 2) {
        input.focus();
        input.classList.add('error');
        return;
    }

    var result = nameCast(name);
    if (!result) {
        input.classList.add('error');
        return;
    }

    savedNameResult = result;

    var guaDisplay = document.getElementById('gua-display');
    // [FIX C1] 同时清理 .coin-flip
    guaDisplay.querySelectorAll('.yao, .coin-flip, .meihua-trigram').forEach(function (el) { el.remove(); });
    guaDisplay.classList.add('meihua-mode');
    var placeholder = guaDisplay.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';

    var upperSpan = document.createElement('span');
    upperSpan.className = 'meihua-trigram';
    upperSpan.textContent = result.upper.symbol;
    guaDisplay.appendChild(upperSpan);

    var lowerSpan = document.createElement('span');
    lowerSpan.className = 'meihua-trigram';
    lowerSpan.textContent = result.lower.symbol;
    guaDisplay.appendChild(lowerSpan);

    document.getElementById('result').classList.remove('hidden');
    renderNameResult(result);
}

// --- 音效系统 ---

var audioCtx = null;
function ensureAudio() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { console.warn('[audio] AudioContext not available:', e); }
    }
    return audioCtx;
}

function playCastSound() {
    try {
        var ctx = ensureAudio();
        if (!ctx) return;
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 800;
        o.type = 'sine';
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        o.start();
        o.stop(ctx.currentTime + 0.1);
    // [FIX F-10] 空 catch 添加 console.warn，按安全审查要求
    } catch(e) { console.warn('[audio] playCastSound failed:', e); }
}

function playChangingSound() {
    try {
        var ctx = ensureAudio();
        if (!ctx) return;
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 1200;
        o.type = 'sine';
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        o.start();
        o.stop(ctx.currentTime + 0.2);
    // [FIX F-10] 空 catch 添加 console.warn，按安全审查要求
    } catch(e) { console.warn('[audio] playChangingSound failed:', e); }
}

// --- 分享卡片 ---

function generateShareCard(result, mode) {
    try {
        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(0, 0, 600, 800);

        ctx.strokeStyle = '#c9a94e';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 580, 780);

        ctx.fillStyle = '#f0d060';
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillText(result.benGua.name + ' ' + result.benGua.symbol, 300, 80);

        ctx.font = '64px serif';
        ctx.fillText(result.benGua.symbol, 300, 180);

        ctx.fillStyle = '#e0d6c2';
        ctx.font = '18px serif';
        wrapText(ctx, result.benGua.judgement, 40, 230, 520, 28);

        var yPos = 290;
        ctx.font = '16px serif';
        if (result.yaoLines) {
            for (var i = 5; i >= 0; i--) {
                var label = result.yaoLines[i].changing ? '⚡ ' : '';
                ctx.fillStyle = result.yaoLines[i].changing ? '#c9a94e' : '#e0d6c2';
                ctx.textAlign = 'left';
                ctx.fillText(label + result.benGua.lines[i], 40, yPos);
                yPos += 26;
            }
        }

        if (result.bianGua) {
            yPos += 12;
            ctx.fillStyle = '#c9a94e';
            ctx.font = '18px serif';
            ctx.textAlign = 'left';
            ctx.fillText('→ 变卦：' + result.bianGua.name + ' ' + result.bianGua.symbol, 40, yPos);
            yPos += 26;
            ctx.fillStyle = '#e0d6c2';
            ctx.font = '16px serif';
            ctx.fillText(result.bianGua.judgement, 40, yPos);
        }

        ctx.fillStyle = 'rgba(201, 169, 78, 0.07)';
        ctx.font = 'bold 72px serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(300, 390);
        ctx.rotate(-0.4);
        ctx.fillText('仅供娱乐', 0, -30);
        ctx.fillText('luyi14-bits', 0, 40);
        ctx.restore();

        ctx.fillStyle = 'rgba(201, 169, 78, 0.4)';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('天问 · AskTheOracle', 300, 770);

        ctx.fillStyle = 'rgba(201, 169, 78, 0.15)';
        ctx.font = '12px serif';
        ctx.fillText('本工具仅供娱乐，结果请勿作为人生决策依据', 300, 755);

        canvas.toBlob(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = result.benGua.name.replace(/[^一-龥]/g, '') + '_天问.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        });
    } catch(e) { console.warn('[share] Canvas share failed:', e); }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var chars = text.split('');
    var line = '';
    var lineY = y;
    for (var i = 0; i < chars.length; i++) {
        var testLine = line + chars[i];
        if (ctx.measureText(testLine).width > maxWidth && i > 0) {
            ctx.fillText(line, x, lineY);
            line = chars[i];
            lineY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, lineY);
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

        // [FIX C1] 同时清理 .coin-flip 元素，避免铜钱旋转动画残留
        document.querySelectorAll('#gua-display .yao, #gua-display .coin-flip').forEach(el => el.remove());
        const placeholder = guaDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = 'none';

        resultDiv.classList.add('hidden');

        const yaoLines = [];
        for (let i = 0; i < 6; i++) {
            const yao = castOnce();
            yaoLines.push(yao);
            Animation.animateCoinFlip(guaDisplay, yao);
            playCastSound();
            if (yao.changing) {
                setTimeout(playChangingSound, 200);
            }
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
    document.getElementById('tab-name').addEventListener('click', () => switchMode('name'));

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

    document.getElementById('btn-name-cast').addEventListener('click', doNameCast);
    document.getElementById('input-name').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doNameCast();
    });

    document.getElementById('btn-share').addEventListener('click', function () {
        var result = null;
        if (currentMode === 'tongqian') result = savedTongqianResult;
        else if (currentMode === 'meihua') result = savedMeihuaResult;
        else if (currentMode === 'name') result = savedNameResult;
        if (result) generateShareCard(result, currentMode);
    });
    // [FIX B4] 输入时清除 error 样式，与梅花输入框行为一致
    document.getElementById('input-name').addEventListener('input', function () {
        this.classList.remove('error');
    });

    document.querySelectorAll('.meihua-input-group input').forEach(inp => {
        inp.addEventListener('input', () => inp.classList.remove('error'));
    });
});
