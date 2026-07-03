/**
 * AskTheOracle — 主逻辑
 *
 * Copyright (C) 2026 天问 (AskTheOracle)
 * Licensed under GNU AGPL v3.0
 */

// --- 农历转换模块 (内嵌简化版) ---

var LunarCalendar = (function () {
    /* 农历年信息编码 (1900-2100)
     * 每个值16位: bit0-3=闰月(0=无闰月), bit4-15=每月大小(1=30天,0=29天, bit4=正月)
     * 数据来源: 香港天文台农历数据
     */
    var LUNAR_YEAR_INFO = [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
        0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
        0x0d520
    ];

    var BASE_YEAR = 1900;
    var BASE_YEAR_DAYS_OFFSET = 49; // days from 1900-01-01 to 1900-01-31 (lunar 1900-01-01)

    function daysInMonth(year, month) {
        if (month === 2) {
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
        }
        var m31 = [1, 3, 5, 7, 8, 10, 12];
        for (var i = 0; i < m31.length; i++) {
            if (m31[i] === month) return 31;
        }
        return 30;
    }

    function solarDaysFromBase(year, month, day) {
        var days = 0;
        for (var y = BASE_YEAR; y < year; y++) {
            days += (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
        }
        for (var m = 1; m < month; m++) {
            days += daysInMonth(year, m);
        }
        days += day - 1;
        return days;
    }

    function getLunarYearDays(lunarYearIndex) {
        var info = LUNAR_YEAR_INFO[lunarYearIndex];
        var days = 0;
        for (var m = 0; m < 12; m++) {
            days += (info & (0x8000 >> (m + 4))) ? 30 : 29;
        }
        var leap = info & 0xf;
        if (leap > 0) {
            days += (info & (0x10000 >> leap)) ? 30 : 29;
        }
        return days;
    }

    function getLunarMonthsArray(lunarYearIndex) {
        var info = LUNAR_YEAR_INFO[lunarYearIndex];
        var leap = info & 0xf;
        var months = [];
        for (var m = 1; m <= 12; m++) {
            months.push({ month: m, isLeap: false, days: (info & (0x8000 >> (m + 4))) ? 30 : 29 });
            if (leap === m) {
                months.push({ month: m, isLeap: true, days: (info & (0x10000 >> m)) ? 30 : 29 });
            }
        }
        return months;
    }

    /**
     * 公历转农历
     * @returns {{ lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean, yearZhiNum: number }}
     *   yearZhiNum: 1=子,2=丑,...,12=亥
     */
    function solarToLunar(year, month, day) {
        var solarDays = solarDaysFromBase(year, month, day);
        if (solarDays < 0) {
            // before 1900, fallback approximate
            var yz = ((year - 4) % 12 + 12) % 12;
            // 【FIX A1】yz+1 替代 yz===0?12:yz，确保子年返回1而非12
            return { lunarYear: year, lunarMonth: month, lunarDay: day, isLeap: false, yearZhiNum: yz + 1 };
        }

        var lunarDaysOffset = solarDays + BASE_YEAR_DAYS_OFFSET;
        var lunarYearIdx = 0;
        var lunarYear = BASE_YEAR;
        var yearDays;
        while (lunarYearIdx < LUNAR_YEAR_INFO.length) {
            yearDays = getLunarYearDays(lunarYearIdx);
            if (lunarDaysOffset < yearDays) break;
            lunarDaysOffset -= yearDays;
            lunarYearIdx++;
            lunarYear++;
        }

        if (lunarYearIdx >= LUNAR_YEAR_INFO.length) {
            // beyond 2100, fallback
            var yz2 = ((year - 4) % 12 + 12) % 12;
            // 【FIX A1】yz+1 替代 yz===0?12:yz
            return { lunarYear: year, lunarMonth: month, lunarDay: day, isLeap: false, yearZhiNum: yz2 + 1 };
        }

        var months = getLunarMonthsArray(lunarYearIdx);
        var lunarMonth = 0;
        var lunarDay = 0;
        var isLeap = false;
        for (var i = 0; i < months.length; i++) {
            if (lunarDaysOffset < months[i].days) {
                lunarMonth = months[i].month;
                lunarDay = lunarDaysOffset + 1;
                isLeap = months[i].isLeap;
                break;
            }
            lunarDaysOffset -= months[i].days;
        }

        var yz = ((lunarYear - 4) % 12 + 12) % 12;
        return {
            lunarYear: lunarYear,
            lunarMonth: lunarMonth,
            lunarDay: lunarDay,
            isLeap: isLeap,
            // 【FIX A1】yz+1 替代 yz===0?12:yz
            yearZhiNum: yz + 1
        };
    }

    /**
     * 小时转时辰编号
     * @returns 1=子时(23-1),2=丑时(1-3),...,12=亥时(21-23)
     */
    function hourToShift(hour) {
        var h = Math.floor((hour + 1) / 2) % 12;
        return h === 0 ? 12 : h;
    }

    return {
        solarToLunar: solarToLunar,
        hourToShift: hourToShift
    };
})();

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
var savedJiaobeiResult = null;
var savedCrossResult = null;
var savedLiurenResult = null;
var savedLiurenSolarResult = null;
var currentLiurenSubMode = 'lunar';
var isCrossModeActive = false;

// --- 交叉起卦命运等级 ---

var CROSS_FATE = {
    5: { label: '大吉·天人合一', text: '姓名与生辰八字高度契合，天时地利人和俱全，万事顺遂。', color: '#4caf50' },
    4: { label: '吉·相辅相成', text: '姓名与生辰配合得当，运势通畅，努力有回报。', color: '#2196f3' },
    3: { label: '平·中规中矩', text: '姓名与生辰五行搭配一般，无大碍亦无大助，需自身努力。', color: '#c9a94e' },
    2: { label: '弱·略有冲克', text: '姓名与生辰存在轻微冲克，行事多遇小阻，宜修身养性。', color: '#ffc107' },
    1: { label: '凶·刑冲克害', text: '姓名与生辰严重不协，多有波折，建议调整或择吉改名。', color: '#e05555' }
};

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

function castJiaoBei() {
    var r = Math.random();
    if (r < 0.5) {
        return { type: 'shengbei', label: '圣杯 ✅', yao: { type: 'yang', changing: false, value: 1 } };
    } else if (r < 0.75) {
        return { type: 'xiaobei', label: '笑杯 ⚠️', yao: { type: 'yin', changing: false, value: 0 } };
    } else {
        return { type: 'yinbei', label: '阴杯 ❌', yao: { type: 'yang', changing: true, value: 1 } };
    }
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

function appendPlainCard(fragment, gua) {
    var text = getPlainText(gua);
    if (!text) return;
    var card = document.createElement('div');
    card.className = 'plain-card';
    card.textContent = '💬 ' + text;
    fragment.appendChild(card);
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

document.addEventListener("DOMContentLoaded", function () {
    var btnCast = document.getElementById("btn-cast");
    var resultDiv = document.getElementById("result");
    var guaDisplay = document.getElementById("gua-display");
    var tabTongqian = document.getElementById('tab-tongqian');
    var tabMeihua = document.getElementById('tab-meihua');
    var tabName = document.getElementById('tab-name');
    var tabJiaobei = document.getElementById('tab-jiaobei');
    var tabLiuren = document.getElementById('tab-liuren');
    var btnMeihuaCast = document.getElementById('btn-meihua-cast');
    var btnRandom = document.getElementById('btn-meihua-random');
    var btnTime = document.getElementById('btn-meihua-time');
    var btnCrossCast = document.getElementById('btn-cross-cast');
    var btnLiuren = document.getElementById('btn-liuren-cast');
    var isCasting = false;
    var isJiaobeiCasting = false;

    btnCast.addEventListener("click", async function () {
        if (isCasting) return;
        isCasting = true;
        btnCast.disabled = true;
        btnCast.textContent = "起卦中…";

        document.querySelectorAll('#gua-display .yao, #gua-display .coin-flip').forEach(function (el) { el.remove(); });
        var placeholder = guaDisplay.querySelector('.placeholder');
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
            await new Promise(function (r) { setTimeout(r, 500); });
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

    tabTongqian.addEventListener('click', function () { if (!isJiaobeiCasting) switchMode('tongqian'); });
    tabMeihua.addEventListener('click', function () { if (!isJiaobeiCasting) switchMode('meihua'); });
    tabName.addEventListener('click', function () { if (!isJiaobeiCasting) switchMode('name'); });
    tabJiaobei.addEventListener('click', function () { if (!isJiaobeiCasting) switchMode('jiaobei'); });
    if (tabLiuren) {
        tabLiuren.addEventListener('click', function () { if (!isJiaobeiCasting) switchMode('liuren'); });
    }

    btnMeihuaCast.addEventListener('click', doMeihuaCast);

    btnRandom.addEventListener('click', function () {
        var n1 = Math.floor(Math.random() * 999) + 1;
        var n2 = Math.floor(Math.random() * 999) + 1;
        var n3 = Math.floor(Math.random() * 999) + 1;
        document.getElementById('input-num1').value = n1;
        document.getElementById('input-num2').value = n2;
        document.getElementById('input-num3').value = n3;
        document.querySelectorAll('.meihua-input-group input').forEach(function (inp) { inp.classList.remove('error'); });
        doMeihuaCast();
    });

    btnTime.addEventListener('click', function () {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var hour = now.getHours();
        var shichen = Math.floor((hour + 1) / 2) % 12 || 12;

        var n1 = (year + month + day) % 8;
        var n2 = (year + month + day + shichen) % 8;
        var n3 = (year + month + day + shichen) % 6;

        document.getElementById('input-num1').value = n1 === 0 ? 8 : n1;
        document.getElementById('input-num2').value = n2 === 0 ? 8 : n2;
        document.getElementById('input-num3').value = n3 === 0 ? 6 : n3;
        document.querySelectorAll('.meihua-input-group input').forEach(function (inp) { inp.classList.remove('error'); });
        doMeihuaCast();
    });

    document.getElementById('btn-name-cast').addEventListener('click', doNameCast);
    document.getElementById('input-name').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doNameCast();
    });

    // 交叉起卦
    if (btnCrossCast) {
        btnCrossCast.addEventListener('click', doCrossCast);
    }

    // 切换交叉分析表单
    var btnToggleCross = document.getElementById('btn-toggle-cross');
    if (btnToggleCross) {
        btnToggleCross.addEventListener('click', function () {
            var birthControls = document.getElementById('birth-controls');
            if (birthControls.classList.contains('hidden')) {
                birthControls.classList.remove('hidden');
                btnToggleCross.textContent = '收起';
                isCrossModeActive = true;
            } else {
                birthControls.classList.add('hidden');
                btnToggleCross.textContent = '交叉分析';
                isCrossModeActive = false;
            }
        });
    }

    // 小六壬
    if (btnLiuren) {
        btnLiuren.addEventListener('click', doLiuren);
    }

    // 小六壬子模式
    var liurenTabLunar = document.getElementById('liuren-tab-lunar');
    var liurenTabSolar = document.getElementById('liuren-tab-solar');
    var btnLiurenSolar = document.getElementById('btn-liuren-solar');
    if (liurenTabLunar) {
        liurenTabLunar.addEventListener('click', function () { switchLiurenSubMode('lunar'); });
    }
    if (liurenTabSolar) {
        liurenTabSolar.addEventListener('click', function () { switchLiurenSubMode('solar'); });
    }
    if (btnLiurenSolar) {
        btnLiurenSolar.addEventListener('click', doLiurenSolar);
    }

    document.getElementById('btn-jiaobei').addEventListener('click', async function () {
        if (isJiaobeiCasting) return;
        isJiaobeiCasting = true;

        var btn = this;
        btn.disabled = true;
        btn.textContent = '掷杯中…';

        var gDisplay = document.getElementById('gua-display');
        gDisplay.querySelectorAll('.jiaobei-result').forEach(function (el) { el.remove(); });
        var placeholder = gDisplay.querySelector('.placeholder');
        if (placeholder) placeholder.style.display = 'none';

        document.getElementById('result').classList.add('hidden');

        var yaoLines = [];
        for (var i = 0; i < 6; i++) {
            var jb = castJiaoBei();
            yaoLines.push(jb.yao);
            Animation.animateJiaobei(gDisplay, jb);
            await new Promise(function (r) { setTimeout(r, 3000); });
        }

        var benGua = findGua(yaoLines);
        var bianGuaResult = getBianGua(benGua, yaoLines);
        var focus = getInterpretationFocus(benGua, bianGuaResult.gua, bianGuaResult.indices);

        var result = {
            benGua: benGua,
            bianGua: bianGuaResult.gua,
            changingIndices: bianGuaResult.indices,
            focus: focus,
            yaoLines: yaoLines
        };
        savedJiaobeiResult = result;

        document.getElementById('result').classList.remove('hidden');
        renderResult(result);

        btn.disabled = false;
        btn.textContent = '再掷一卦';
        isJiaobeiCasting = false;
    });

    document.getElementById('btn-share').addEventListener('click', function () {
        var result = null;
        if (currentMode === 'tongqian') result = savedTongqianResult;
        else if (currentMode === 'meihua') result = savedMeihuaResult;
        else if (currentMode === 'name') result = savedNameResult;
        else if (currentMode === 'jiaobei') result = savedJiaobeiResult;
        else if (currentMode === 'liuren') return; // 小六壬暂无分享
        if (result) generateShareCard(result, currentMode);
    });

    document.getElementById('input-name').addEventListener('input', function () {
        this.classList.remove('error');
    });

    document.querySelectorAll('.meihua-input-group input').forEach(function (inp) {
        inp.addEventListener('input', function () { inp.classList.remove('error'); });
    });
});

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

    appendPlainCard(fragment, benGua);

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

        const bgPlainText = getPlainText(bianGua);
        if (bgPlainText) {
            const bgp = document.createElement('div');
            bgp.className = 'plain-card';
            bgp.style.marginTop = '8px';
            bgp.textContent = '💬 ' + bgPlainText;
            card.appendChild(bgp);
        }

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

    appendPlainCard(fragment, benGua);

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

        var plainText = getPlainText(bianGua);
        if (plainText) {
            var bp = document.createElement('div');
            bp.className = 'plain-card';
            bp.style.marginTop = '8px';
            bp.textContent = '💬 ' + plainText;
            card.appendChild(bp);
        }

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

    // 【FIX】五格姓名学卡片仅用于姓名起卦结果，梅花易数不含 strokes 字段
    if (result.strokes) {
        renderWuge(result, fragment);
    }

    interpEl.appendChild(fragment);
}

function switchMode(mode) {
    currentMode = mode;

    var tabTongqian = document.getElementById('tab-tongqian');
    var tabMeihua = document.getElementById('tab-meihua');
    var tabName = document.getElementById('tab-name');
    var tabJiaobei = document.getElementById('tab-jiaobei');
    var tabLiuren = document.getElementById('tab-liuren');
    var controls = document.getElementById('controls');
    var meihuaControls = document.getElementById('meihua-controls');
    var nameControls = document.getElementById('name-controls');
    var jiaobeiControls = document.getElementById('jiaobei-controls');
    var liurenControls = document.getElementById('liuren-controls');
    var guaDisplay = document.getElementById('gua-display');
    var resultDiv = document.getElementById('result');
    var nameEl = document.getElementById('gua-name');
    var symbolEl = document.getElementById('gua-symbol');
    var interpEl = document.getElementById('gua-interpretation');

    // 重置所有 tab
    tabTongqian.classList.remove('active');
    tabMeihua.classList.remove('active');
    tabName.classList.remove('active');
    tabJiaobei.classList.remove('active');
    if (tabLiuren) tabLiuren.classList.remove('active');

    // 隐藏所有控件
    controls.style.display = 'none';
    meihuaControls.classList.add('hidden');
    nameControls.classList.add('hidden');
    jiaobeiControls.classList.add('hidden');
    if (liurenControls) liurenControls.classList.add('hidden');

    guaDisplay.querySelectorAll('.yao, .coin-flip, .meihua-trigram, .jiaobei-result').forEach(function (el) { el.remove(); });
    guaDisplay.classList.remove('meihua-mode');
    var placeholder = guaDisplay.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = '';

    nameEl.textContent = '';
    symbolEl.textContent = '';
    interpEl.textContent = '';
    resultDiv.classList.add('hidden');

    if (mode === 'tongqian') {
        tabTongqian.classList.add('active');
        controls.style.display = '';
        if (savedTongqianResult) {
            resultDiv.classList.remove('hidden');
            renderResult(savedTongqianResult);
        }
    } else if (mode === 'meihua') {
        tabMeihua.classList.add('active');
        meihuaControls.classList.remove('hidden');
        if (placeholder) placeholder.style.display = 'none';
        if (savedMeihuaResult) {
            resultDiv.classList.remove('hidden');
            renderMeihuaResult(savedMeihuaResult);
        }
    } else if (mode === 'name') {
        tabName.classList.add('active');
        nameControls.classList.remove('hidden');
        // 【FIX A2】交叉模式下保留和恢复交叉分析结果
        if (isCrossModeActive && savedCrossResult) {
            resultDiv.classList.remove('hidden');
            renderCrossResult(savedCrossResult);
        } else if (savedNameResult) {
            resultDiv.classList.remove('hidden');
            renderNameResult(savedNameResult);
        }
    } else if (mode === 'jiaobei') {
        tabJiaobei.classList.add('active');
        jiaobeiControls.classList.remove('hidden');
        if (savedJiaobeiResult) {
            resultDiv.classList.remove('hidden');
            renderResult(savedJiaobeiResult);
        }
    } else if (mode === 'liuren') {
        if (tabLiuren) tabLiuren.classList.add('active');
        if (liurenControls) liurenControls.classList.remove('hidden');
        switchLiurenSubMode(currentLiurenSubMode);
        if (savedLiurenResult) {
            resultDiv.classList.remove('hidden');
            renderLiurenResult(savedLiurenResult);
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

// --- 交叉起卦 (姓名+生辰) ---

/**
 * crossCast 姓名+生辰交叉起卦
 * @param {string} name 姓名
 * @param {number} year 公历年
 * @param {number} month 公历月
 * @param {number} day 公历日
 * @param {number} hour 小时(0-23)
 */
function crossCast(name, year, month, day, hour) {
    var parsed = parseName(name);
    if (!parsed) return null;

    var strokes = calcNameStrokes(parsed);
    if (strokes.missing.length > 0 || strokes.surnameStrokes === 0 || strokes.givenStrokes === 0) return null;

    var lunar = LunarCalendar.solarToLunar(year, month, day);
    var shichen = LunarCalendar.hourToShift(hour);

    // 公式: upper=(surnameStrokes+yearZhiNum)%8, lower=(givenStrokes+month)%8, dongYao=(day+shichen)%6
    var upperNum = (strokes.surnameStrokes + lunar.yearZhiNum) % 8;
    var lowerNum = (strokes.givenStrokes + lunar.lunarMonth) % 8;
    var dongYaoNum = (lunar.lunarDay + shichen) % 6;
    if (dongYaoNum === 0) dongYaoNum = 6;
    if (upperNum === 0) upperNum = 8;
    if (lowerNum === 0) lowerNum = 8;

    var upper = numberToTrigram(upperNum);
    var lower = numberToTrigram(lowerNum);
    var binary = TRIGRAM_TO_BINARY[upper.symbol] + TRIGRAM_TO_BINARY[lower.symbol];
    var benGua = GUA_BY_BINARY[binary];
    if (!benGua) return null;

    var huGua = calcHuGua(benGua);

    var yaoLines = benGua.binary.split('').map(function (bit, i) {
        return { value: parseInt(bit, 10), type: bit === '1' ? 'yang' : 'yin', changing: (i === (dongYaoNum - 1)) };
    });
    var bianGuaResult = getBianGua(benGua, yaoLines);

    var tiYong = calcTiYong(upper, lower, dongYaoNum);
    var tiWx = TRIGRAM_WUXING[tiYong.tiGua.symbol];
    var yongWx = TRIGRAM_WUXING[tiYong.yongGua.symbol];
    var shengke = judgeShengKe(tiWx, yongWx);

    // 交叉命运等级: 综合体用生克与姓名生辰的契合度
    var fateLevel = shengke.level;

    // 【FIX A3】交叉参考五格数理评分调整 fateLevel
    var wuge = calcWuge({ parsed: parsed, strokes: strokes });
    var badCount = 0;
    var wugeKeys = ['tian', 'ren', 'di', 'zong', 'wai'];
    for (var wk = 0; wk < wugeKeys.length; wk++) {
        var level = wuge[wugeKeys[wk]].judgment.level;
        if (level === '凶' || level === '大凶') badCount++;
    }
    // badCount>=2 → 降1级；>=3 → 降2级；>=4 → 降3级
    if (badCount >= 4) {
        fateLevel = Math.max(1, fateLevel - 3);
    } else if (badCount >= 3) {
        fateLevel = Math.max(1, fateLevel - 2);
    } else if (badCount >= 2) {
        fateLevel = Math.max(1, fateLevel - 1);
    }
    // 三才凶 → 额外降1级
    if (wuge.sancai && wuge.sancai.judgment && wuge.sancai.judgment.indexOf('凶') !== -1) {
        fateLevel = Math.max(1, fateLevel - 1);
    }

    var changingIndices = bianGuaResult.indices;
    var focus = getInterpretationFocus(benGua, bianGuaResult.gua, changingIndices);

    return {
        parsed: parsed,
        strokes: strokes,
        lunar: lunar,
        shichen: shichen,
        benGua: benGua,
        huGua: huGua,
        bianGua: bianGuaResult.gua,
        tiYong: tiYong,
        shengke: shengke,
        upper: upper,
        lower: lower,
        dongYao: dongYaoNum,
        focus: focus,
        fateLevel: fateLevel,
        wuge: wuge
    };
}

function renderCrossResult(result) {
    var nameEl = document.getElementById('gua-name');
    var symbolEl = document.getElementById('gua-symbol');
    var interpEl = document.getElementById('gua-interpretation');

    var { parsed, strokes, lunar, shichen, benGua, huGua, bianGua, tiYong, shengke, upper, lower, dongYao, focus, fateLevel } = result;

    nameEl.textContent = benGua.name + ' ' + benGua.symbol;
    symbolEl.textContent = '';

    interpEl.textContent = '';
    var fragment = document.createDocumentFragment();

    // 生辰信息 + 笔画明细
    var detailDiv = document.createElement('div');
    detailDiv.className = 'stroke-detail';
    var strokeEntries = [];
    strokes.surnameChars.concat(strokes.givenChars).forEach(function (x) {
        var span = document.createElement('span');
        span.className = 'stroke-char';
        span.appendChild(document.createTextNode(x.char));
        span.appendChild(document.createTextNode('→'));
        var numSpan = document.createElement('span');
        numSpan.className = 'stroke-num';
        numSpan.textContent = x.stroke;
        span.appendChild(numSpan);
        span.appendChild(document.createTextNode('画'));
        strokeEntries.push(span);
    });
    strokeEntries.forEach(function (s, i) {
        if (i > 0) detailDiv.appendChild(document.createTextNode(' / '));
        detailDiv.appendChild(s);
    });
    var br1 = document.createElement('br');
    detailDiv.appendChild(br1);
    var lunarSpan = document.createElement('span');
    lunarSpan.className = 'stroke-sum';
    lunarSpan.textContent = '农历' + lunar.lunarYear + '年' + (lunar.isLeap ? '闰' : '') + lunar.lunarMonth + '月' + lunar.lunarDay + '日 ' + shichen + '时';
    detailDiv.appendChild(lunarSpan);
    var br2 = document.createElement('br');
    detailDiv.appendChild(br2);
    var formulaSpan = document.createElement('span');
    formulaSpan.className = 'stroke-sum';
    formulaSpan.textContent = '上卦=(姓' + strokes.surnameStrokes + '+' + lunar.yearZhiNum + ')%8=' + upper.xiantianNum + ' / 下卦=(名' + strokes.givenStrokes + '+' + lunar.lunarMonth + ')%8=' + lower.xiantianNum + ' / 动爻=(' + lunar.lunarDay + '+' + shichen + ')%6=' + dongYao;
    detailDiv.appendChild(formulaSpan);
    fragment.appendChild(detailDiv);

    // 交叉命运卡片
    var fate = CROSS_FATE[fateLevel] || CROSS_FATE[3];
    var fateCard = document.createElement('div');
    fateCard.className = 'cross-fate-card';
    fateCard.style.borderColor = fate.color;
    var fateHeader = document.createElement('div');
    fateHeader.className = 'card-header';
    fateHeader.style.color = fate.color;
    fateHeader.textContent = fate.label;
    fateCard.appendChild(fateHeader);
    var fateBody = document.createElement('div');
    fateBody.className = 'card-body';
    fateBody.textContent = fate.text;
    fateCard.appendChild(fateBody);
    fragment.appendChild(fateCard);

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

    appendPlainCard(fragment, benGua);

    // 互卦
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

    // 变卦
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
        var bPlainText = getPlainText(bianGua);
        if (bPlainText) {
            var bp = document.createElement('div');
            bp.className = 'plain-card';
            bp.style.marginTop = '8px';
            bp.textContent = '💬 ' + bPlainText;
            bCard.appendChild(bp);
        }
        fragment.appendChild(bCard);
    }

    // 体用生克
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

    // 【FIX A3】交叉分析结果追加五格姓名学卡片
    renderWuge(result, fragment);

    interpEl.appendChild(fragment);
}

function doCrossCast() {
    var nameInput = document.getElementById('input-name');
    var yearInput = document.getElementById('input-birth-year');
    var monthInput = document.getElementById('input-birth-month');
    var dayInput = document.getElementById('input-birth-day');
    var hourInput = document.getElementById('input-birth-hour');

    nameInput.classList.remove('error');
    yearInput.classList.remove('error');
    monthInput.classList.remove('error');
    dayInput.classList.remove('error');
    hourInput.classList.remove('error');

    var name = nameInput.value.trim();
    var year = parseInt(yearInput.value, 10);
    var month = parseInt(monthInput.value, 10);
    var day = parseInt(dayInput.value, 10);
    var hour = parseInt(hourInput.value, 10);

    if (name.length < 2) { nameInput.classList.add('error'); return; }
    if (isNaN(year) || year < 1900 || year > 2100) { yearInput.classList.add('error'); return; }
    if (isNaN(month) || month < 1 || month > 12) { monthInput.classList.add('error'); return; }
    if (isNaN(day) || day < 1 || day > 31) { dayInput.classList.add('error'); return; }
    if (isNaN(hour) || hour < 0 || hour > 23) { hourInput.classList.add('error'); return; }

    var result = crossCast(name, year, month, day, hour);
    if (!result) {
        nameInput.classList.add('error');
        return;
    }

    savedCrossResult = result;

    var guaDisplay = document.getElementById('gua-display');
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
    renderCrossResult(result);
}

// --- 原有 renderNameResult ---

function renderNameResult(result) {
    var nameEl = document.getElementById('gua-name');
    var symbolEl = document.getElementById('gua-symbol');
    var interpEl = document.getElementById('gua-interpretation');

    var { parsed, strokes, benGua, huGua, bianGua, tiYong, shengke, upper, lower, dongYao, focus } = result;

    nameEl.textContent = benGua.name + ' ' + benGua.symbol;
    symbolEl.textContent = '';

    interpEl.textContent = '';
    var fragment = document.createDocumentFragment();

    var detailDiv = document.createElement('div');
    detailDiv.className = 'stroke-detail';
    var strokeEntries = [];
    strokes.surnameChars.concat(strokes.givenChars).forEach(function (x) {
        var span = document.createElement('span');
        span.className = 'stroke-char';
        span.appendChild(document.createTextNode(x.char));
        span.appendChild(document.createTextNode('→'));
        var numSpan = document.createElement('span');
        numSpan.className = 'stroke-num';
        numSpan.textContent = x.stroke;
        span.appendChild(numSpan);
        span.appendChild(document.createTextNode('画'));
        strokeEntries.push(span);
    });
    strokeEntries.forEach(function (s, i) {
        if (i > 0) detailDiv.appendChild(document.createTextNode(' / '));
        detailDiv.appendChild(s);
    });
    var br = document.createElement('br');
    detailDiv.appendChild(br);
    var sumSpan = document.createElement('span');
    sumSpan.className = 'stroke-sum';
    sumSpan.textContent = '姓' + strokes.surnameStrokes + '画 + 名' + strokes.givenStrokes + '画 = ' + strokes.totalStrokes + '画，动在第' + dongYao + '爻';
    detailDiv.appendChild(sumSpan);
    fragment.appendChild(detailDiv);

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

    appendPlainCard(fragment, benGua);

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

        var bPlainText = getPlainText(bianGua);
        if (bPlainText) {
            var bp = document.createElement('div');
            bp.className = 'plain-card';
            bp.style.marginTop = '8px';
            bp.textContent = '💬 ' + bPlainText;
            bCard.appendChild(bp);
        }

        fragment.appendChild(bCard);
    }

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

    // 五格姓名学卡片
    renderWuge(result, fragment);

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

// --- 小六壬 (Xiao Liu Ren) ---

var LIUREN_DATA = [
    { name: '大安', judgment: '身不动时', meaning: '大安事事昌，求谋在东方，失物去不远，宅舍保安康。行人身未动，病者主无妨，将军回田野，仔细与推详。', level: 5, color: '#4caf50', element: '木', direction: '东' },
    { name: '留连', judgment: '卒未归时', meaning: '留连事难成，求谋日不明，官事只宜缓，去者未回程。失物南方见，急讨方称心，更须防口舌，人口且平平。', level: 2, color: '#e05555', element: '水', direction: '南' },
    { name: '速喜', judgment: '人便至时', meaning: '速喜喜来临，求财向南行，失物申午未，逢人路上寻。官事有福德，病者无祸侵，田宅六畜吉，行人有信音。', level: 4, color: '#2196f3', element: '火', direction: '南' },
    { name: '赤口', judgment: '官事凶时', meaning: '赤口主口舌，官非切要防，失物急去寻，行人有惊慌。鸡犬多作怪，病者出西方，更须防诅咒，恐怕染瘟癀。', level: 1, color: '#d32f2f', element: '金', direction: '西' },
    { name: '小吉', judgment: '人来喜时', meaning: '小吉最吉昌，路上好商量，阴人来报喜，失物在坤方。行人立便至，交关真是强，凡事皆和合，病者叩穹苍。', level: 5, color: '#4caf50', element: '木', direction: '坤(西南)' },
    { name: '空亡', judgment: '音信稀时', meaning: '空亡事不长，阴人小乖张，求财无利益，行人有灾殃。失物寻不见，官事有刑伤，病人逢暗鬼，禳解保安康。', level: 1, color: '#9e9e9e', element: '土', direction: '中' }
];

/**
 * 小六壬掐算
 * @param {number} month 农历月(1-12)
 * @param {number} day 农历日(1-30)
 * @param {number} hour 时辰编号(1=子,2=丑,...,12=亥)
 * @returns {{ position: number, result: object, steps: Array }}
 */
function xiaoliuren(month, day, hour) {
    var idx = 0; // 从大安(index=0)开始
    var steps = [{ idx: idx, name: LIUREN_DATA[idx].name, phase: '起始' }];

    // 月上起日：从大安起正月，顺数到 month
    idx = (month - 1) % 6;
    steps.push({ idx: idx, name: LIUREN_DATA[idx].name, phase: '月上' });

    // 日上起时：从月上位置顺数 day-1 步
    var dayIdx = (idx + day - 1) % 6;
    steps.push({ idx: dayIdx, name: LIUREN_DATA[dayIdx].name, phase: '日上' });

    // 时上查掌诀：从日上位置顺数 hour-1 步
    var finalIdx = (dayIdx + hour - 1) % 6;
    steps.push({ idx: finalIdx, name: LIUREN_DATA[finalIdx].name, phase: '时上(最终)' });

    return { position: finalIdx, result: LIUREN_DATA[finalIdx], steps: steps, month: month, day: day, hour: hour };
}

function renderLiurenResult(liuren) {
    var interpEl = document.getElementById('gua-interpretation');
    var nameEl = document.getElementById('gua-name');
    var symbolEl = document.getElementById('gua-symbol');

    nameEl.textContent = liuren.result.name;
    symbolEl.textContent = '';

    interpEl.textContent = '';
    var fragment = document.createDocumentFragment();

    // 结果主卡片
    var card = document.createElement('div');
    card.className = 'liuren-result-card';
    card.style.borderColor = liuren.result.color;

    var cardName = document.createElement('div');
    cardName.className = 'liuren-result-name';
    cardName.style.color = liuren.result.color;
    cardName.textContent = liuren.result.name + ' (' + liuren.result.judgment + ')';
    card.appendChild(cardName);

    var cardInfo = document.createElement('div');
    cardInfo.className = 'liuren-result-info';
    cardInfo.textContent = '五行: ' + liuren.result.element + ' | 方位: ' + liuren.result.direction;
    card.appendChild(cardInfo);

    var cardMeaning = document.createElement('div');
    cardMeaning.className = 'liuren-result-meaning';
    cardMeaning.textContent = liuren.result.meaning;
    card.appendChild(cardMeaning);

    fragment.appendChild(card);

    // 推算过程
    var stepsDiv = document.createElement('div');
    stepsDiv.className = 'liuren-steps';
    var stepsTitle = document.createElement('div');
    stepsTitle.className = 'liuren-steps-title';
    if (liuren.solarSource) {
        stepsTitle.textContent = '推算过程: 公历' + liuren.solarSource + ' → 农历' + liuren.month + '月' + liuren.day + '日 ' + liuren.hour + '时';
    } else {
        stepsTitle.textContent = '推算过程: 农历' + liuren.month + '月' + liuren.day + '日 ' + liuren.hour + '时';
    }
    stepsDiv.appendChild(stepsTitle);

    var stepsList = document.createElement('div');
    stepsList.className = 'liuren-steps-list';
    liuren.steps.forEach(function (s, i) {
        var item = document.createElement('span');
        item.className = 'liuren-step-item';
        if (i === liuren.steps.length - 1) item.classList.add('liuren-step-final');
        item.textContent = (i > 0 ? ' → ' : '') + s.phase + ':' + s.name;
        stepsList.appendChild(item);
    });
    stepsDiv.appendChild(stepsList);
    fragment.appendChild(stepsDiv);

    interpEl.appendChild(fragment);
}

// --- 小六壬子模式路由 ---

function switchLiurenSubMode(mode) {
    currentLiurenSubMode = mode;

    var tabLunar = document.getElementById('liuren-tab-lunar');
    var tabSolar = document.getElementById('liuren-tab-solar');
    var lunarControls = document.getElementById('liuren-lunar-controls');
    var solarControls = document.getElementById('liuren-solar-controls');

    tabLunar.classList.toggle('active', mode === 'lunar');
    tabSolar.classList.toggle('active', mode === 'solar');
    lunarControls.classList.toggle('hidden', mode !== 'lunar');
    solarControls.classList.toggle('hidden', mode !== 'solar');

    if (mode === 'solar') {
        initLiurenSolarSelects();
    }
}

var _liurenSolarInitialized = false;

function initLiurenSolarSelects() {
    if (_liurenSolarInitialized) return;
    _liurenSolarInitialized = true;

    var selYear = document.getElementById('liuren-sel-year');
    for (var y = 1900; y <= 2100; y++) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        selYear.appendChild(opt);
    }
    selYear.value = new Date().getFullYear();

    var selMonth = document.getElementById('liuren-sel-month');
    for (var m = 1; m <= 12; m++) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        selMonth.appendChild(opt);
    }

    var selDay = document.getElementById('liuren-sel-day');
    updateLiurenDayOptions();

    selYear.addEventListener('change', updateLiurenDayOptions);
    selMonth.addEventListener('change', updateLiurenDayOptions);

    var selHour = document.getElementById('liuren-sel-hour');
    for (var h = 0; h <= 23; h++) {
        var opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        selHour.appendChild(opt);
    }
    selHour.value = 12;

    var selMinute = document.getElementById('liuren-sel-minute');
    for (var mi = 0; mi <= 59; mi++) {
        var opt = document.createElement('option');
        opt.value = mi;
        opt.textContent = mi < 10 ? '0' + mi : '' + mi;
        selMinute.appendChild(opt);
    }
}

function updateLiurenDayOptions() {
    var selYear = document.getElementById('liuren-sel-year');
    var selMonth = document.getElementById('liuren-sel-month');
    var selDay = document.getElementById('liuren-sel-day');
    var year = parseInt(selYear.value, 10);
    var month = parseInt(selMonth.value, 10);
    var maxDay = (month === 2) ? ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28)
                : ([31,0,31,30,31,30,31,31,30,31,30,31][month - 1]);

    var currentDay = parseInt(selDay.value, 10);
    selDay.innerHTML = '';
    for (var d = 1; d <= maxDay; d++) {
        var opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        selDay.appendChild(opt);
    }
    if (currentDay >= 1 && currentDay <= maxDay) {
        selDay.value = currentDay;
    }
}

function doLiurenSolar() {
    var year = parseInt(document.getElementById('liuren-sel-year').value, 10);
    var month = parseInt(document.getElementById('liuren-sel-month').value, 10);
    var day = parseInt(document.getElementById('liuren-sel-day').value, 10);
    var hour = parseInt(document.getElementById('liuren-sel-hour').value, 10);

    var lunar = LunarCalendar.solarToLunar(year, month, day);
    if (!lunar) { alert('年份超出范围（1900-2100）'); return; }

    var lunarMonth = lunar.lunarMonth;
    var lunarDay = lunar.lunarDay;

    var hourZhi = LunarCalendar.hourToShift(hour);

    var result = xiaoliuren(lunarMonth, lunarDay, hourZhi);
    result.solarSource = year + '/' + month + '/' + day + ' ' + hour + ':00';
    savedLiurenSolarResult = result;
    savedLiurenResult = result;

    Animation.animateLiuren(document.getElementById('gua-display'), result);

    document.getElementById('result').classList.remove('hidden');
    renderLiurenResult(result);
}

function doLiuren() {
    var monthInput = document.getElementById('input-liuren-month');
    var dayInput = document.getElementById('input-liuren-day');
    var hourInput = document.getElementById('input-liuren-hour');

    monthInput.classList.remove('error');
    dayInput.classList.remove('error');
    hourInput.classList.remove('error');

    var month = parseInt(monthInput.value, 10);
    var day = parseInt(dayInput.value, 10);
    var hour = parseInt(hourInput.value, 10);

    if (isNaN(month) || month < 1 || month > 12) { monthInput.classList.add('error'); return; }
    if (isNaN(day) || day < 1 || day > 30) { dayInput.classList.add('error'); return; }
    if (isNaN(hour) || hour < 1 || hour > 12) { hourInput.classList.add('error'); return; }

    var result = xiaoliuren(month, day, hour);
    savedLiurenResult = result;

    // 动画
    Animation.animateLiuren(document.getElementById('gua-display'), result);

    document.getElementById('result').classList.remove('hidden');
    renderLiurenResult(result);
}

// --- 五格姓名学 (Wuge) ---

var WUGE_JUDGMENT = {
    1:  { name: '太极之数', level: '大吉' },
    2:  { name: '两仪之数', level: '凶' },
    3:  { name: '三才之数', level: '大吉' },
    4:  { name: '四象之数', level: '凶' },
    5:  { name: '五行之数', level: '大吉' },
    6:  { name: '六爻之数', level: '大吉' },
    7:  { name: '七政之数', level: '大吉' },
    8:  { name: '八卦之数', level: '大吉' },
    9:  { name: '大成之数', level: '凶' },
    10: { name: '终结之数', level: '凶' },
    11: { name: '旱苗逢雨', level: '大吉' },
    12: { name: '掘井无泉', level: '凶' },
    13: { name: '春日牡丹', level: '大吉' },
    14: { name: '破兆之数', level: '凶' },
    15: { name: '福寿之数', level: '大吉' },
    16: { name: '厚重之数', level: '大吉' },
    17: { name: '刚强之数', level: '半吉' },
    18: { name: '铁镜重磨', level: '半吉' },
    19: { name: '多难之数', level: '凶' },
    20: { name: '屋下藏金', level: '凶' },
    21: { name: '明月中天', level: '大吉' },
    22: { name: '秋草逢霜', level: '凶' },
    23: { name: '壮丽之数', level: '大吉' },
    24: { name: '掘藏得金', level: '大吉' },
    25: { name: '资性英敏', level: '大吉' },
    26: { name: '变怪之数', level: '凶' },
    27: { name: '欲望无止', level: '凶' },
    28: { name: '阔水浮萍', level: '凶' },
    29: { name: '智谋之数', level: '半吉' },
    30: { name: '非运之数', level: '凶' },
    31: { name: '春日花开', level: '大吉' },
    32: { name: '宝马金鞍', level: '大吉' },
    33: { name: '旭日升天', level: '大吉' },
    34: { name: '破家之数', level: '大凶' },
    35: { name: '高楼望月', level: '大吉' },
    36: { name: '波澜重叠', level: '凶' },
    37: { name: '猛虎出林', level: '大吉' },
    38: { name: '磨铁成针', level: '半吉' },
    39: { name: '富贵荣华', level: '大吉' },
    40: { name: '退安之数', level: '凶' },
    41: { name: '有德之数', level: '大吉' },
    42: { name: '寒蝉在柳', level: '凶' },
    43: { name: '散财破产', level: '凶' },
    44: { name: '烦闷之数', level: '凶' },
    45: { name: '顺风之数', level: '大吉' },
    46: { name: '浪里淘金', level: '凶' },
    47: { name: '点石成金', level: '大吉' },
    48: { name: '古松立鹤', level: '大吉' },
    49: { name: '转变之数', level: '半吉' },
    50: { name: '小舟入海', level: '凶' },
    51: { name: '沉浮之数', level: '半吉' },
    52: { name: '达眼之数', level: '大吉' },
    53: { name: '曲卷难星', level: '凶' },
    54: { name: '石上栽花', level: '凶' },
    55: { name: '善恶之数', level: '凶' },
    56: { name: '浪里行舟', level: '凶' },
    57: { name: '日照春松', level: '大吉' },
    58: { name: '晚行遇月', level: '半吉' },
    59: { name: '寒蝉悲风', level: '凶' },
    60: { name: '无谋之数', level: '凶' },
    61: { name: '牡丹芙蓉', level: '大吉' },
    62: { name: '衰败之数', level: '凶' },
    63: { name: '舟归平海', level: '大吉' },
    64: { name: '非命之数', level: '凶' },
    65: { name: '巨流归海', level: '大吉' },
    66: { name: '岩头步马', level: '凶' },
    67: { name: '顺风通达', level: '大吉' },
    68: { name: '顺风吹帆', level: '大吉' },
    69: { name: '非业之数', level: '凶' },
    70: { name: '残菊逢霜', level: '凶' },
    71: { name: '石上金花', level: '半吉' },
    72: { name: '劳苦之数', level: '凶' },
    73: { name: '无勇之数', level: '半吉' },
    74: { name: '残花经霜', level: '凶' },
    75: { name: '退守之数', level: '凶' },
    76: { name: '离散之数', level: '凶' },
    77: { name: '半吉之数', level: '半吉' },
    78: { name: '晚苦之数', level: '凶' },
    79: { name: '云头望月', level: '凶' },
    80: { name: '遁吉之数', level: '凶' },
    81: { name: '万物回春', level: '大吉' }
 };

/**
 * 计算五格数理
 * @param {object} nameResult nameCast 返回的结果
 * @returns {{ tian: number, ren: number, di: number, zong: number, wai: number }}
 */
function calcWuge(nameResult) {
    var strokes = nameResult.strokes;
    var parsed = nameResult.parsed;

    // 天格: 姓氏笔画 + 1 (单姓) 或 姓氏笔画总和 (复姓)
    var tian;
    if (parsed.type === 'compound-single' || parsed.type === 'compound-double') {
        tian = strokes.surnameStrokes;
    } else {
        tian = strokes.surnameStrokes + 1;
    }

    // 人格: 姓氏末字 + 名字首字
    var ren;
    var lastSurnameStroke = parsed.surname.length === 1
        ? strokes.surnameStrokes
        : (strokes.surnameChars[strokes.surnameChars.length - 1].stroke || 0);
    var firstGivenStroke = strokes.givenChars[0].stroke || 0;
    ren = lastSurnameStroke + firstGivenStroke;

    // 地格: 名字总笔画 (单名则+1)
    var di;
    if (parsed.given.length === 1) {
        di = strokes.givenStrokes + 1;
    } else {
        di = strokes.givenStrokes;
    }

    // 总格: 姓+名总笔画
    var zong = strokes.totalStrokes;

    // 外格: 总格 - 人格 + 1 (单姓单名); 总格 - 人格 + 1 通用公式
    var wai = zong - ren + 1;
    if (parsed.given.length === 1 && (parsed.type === 'single-single' || parsed.type === 'compound-single')) {
        wai = 2; // 单名的外格特殊处理
    }

    // 限制在 1-81 范围内
    var clamp = function (n) { return Math.max(1, Math.min(81, n)); };

    var wuge = {
        tian: { value: clamp(tian), name: '天格', raw: tian },
        ren:  { value: clamp(ren), name: '人格', raw: ren },
        di:   { value: clamp(di), name: '地格', raw: di },
        zong: { value: clamp(zong), name: '总格', raw: zong },
        wai:  { value: clamp(wai), name: '外格', raw: wai }
    };

    // 附加五行属性
    var wuxingMap = function (n) {
        var x = n % 10;
        if (x === 1 || x === 2) return '木';
        if (x === 3 || x === 4) return '火';
        if (x === 5 || x === 6) return '土';
        if (x === 7 || x === 8) return '金';
        return '水';
    };

    wuge.tian.wuxing = wuxingMap(clamp(tian));
    wuge.ren.wuxing = wuxingMap(clamp(ren));
    wuge.di.wuxing = wuxingMap(clamp(di));
    wuge.zong.wuxing = wuxingMap(clamp(zong));
    wuge.wai.wuxing = wuxingMap(clamp(wai));

    wuge.tian.judgment = WUGE_JUDGMENT[clamp(tian)] || { name: '未知', level: '--' };
    wuge.ren.judgment = WUGE_JUDGMENT[clamp(ren)] || { name: '未知', level: '--' };
    wuge.di.judgment = WUGE_JUDGMENT[clamp(di)] || { name: '未知', level: '--' };
    wuge.zong.judgment = WUGE_JUDGMENT[clamp(zong)] || { name: '未知', level: '--' };
    wuge.wai.judgment = WUGE_JUDGMENT[clamp(wai)] || { name: '未知', level: '--' };

    wuge.sancai = calcSancai(wuge);

    return wuge;
}

/**
 * 三才五行配置
 */
function calcSancai(wuge) {
    var t = wuge.tian.wuxing;
    var r = wuge.ren.wuxing;
    var d = wuge.di.wuxing;

    var result = { tianWuxing: t, renWuxing: r, diWuxing: d, config: t + r + d, judgment: '', level: 3 };

    // 三才相生的最佳组合
    // 天格生人格、人格生地格：大吉
    if (WUXING_SHENG[t] === r && WUXING_SHENG[r] === d) {
        result.judgment = '大吉·三才相生';
        result.level = 5;
    } else if (WUXING_SHENG[t] === r && r === d) {
        result.judgment = '吉·天人相生，人地比和';
        result.level = 4;
    } else if (t === r && WUXING_SHENG[r] === d) {
        result.judgment = '吉·天人比和，人地相生';
        result.level = 4;
    } else if (t === r && r === d) {
        result.judgment = '平·三才比和';
        result.level = 3;
    } else if (WUXING_SHENG[t] === r && WUXING_KE[r] === d) {
        result.judgment = '弱·天生人，人克地';
        result.level = 2;
    } else if (WUXING_SHENG[d] === r && WUXING_SHENG[r] === t) {
        result.judgment = '凶·逆克相生';
        result.level = 1;
    } else {
        // 检查相克
        if (WUXING_KE[t] === r) {
            result.judgment = '凶·天克人，运势受阻';
            result.level = 1;
        } else if (WUXING_KE[r] === d) {
            result.judgment = '弱·人克地，根基不稳';
            result.level = 2;
        } else {
            result.judgment = '平·三才一般';
            result.level = 3;
        }
    }

    return result;
}

/**
 * 在命名结果中追加五格姓名学卡片
 */
function renderWuge(nameResult, fragment) {
    var wuge = calcWuge(nameResult);

    var card = document.createElement('div');
    card.className = 'wuge-card';

    var cardTitle = document.createElement('div');
    cardTitle.className = 'wuge-card-title';
    cardTitle.textContent = '五格姓名学';
    card.appendChild(cardTitle);

    var keys = ['tian', 'ren', 'di', 'zong', 'wai'];
    keys.forEach(function (k) {
        var g = wuge[k];
        var row = document.createElement('div');
        row.className = 'wuge-row';

        var label = document.createElement('span');
        label.className = 'wuge-label';
        label.textContent = g.name;
        row.appendChild(label);

        var val = document.createElement('span');
        val.className = 'wuge-value';
        val.textContent = g.value + '画 (' + g.wuxing + ')';
        row.appendChild(val);

        var jud = document.createElement('span');
        jud.className = 'wuge-judgment';
        var j = g.judgment;
        if (j.level === '大吉') jud.classList.add('wuge-daji');
        else if (j.level === '吉') jud.classList.add('wuge-ji');
        else if (j.level === '半吉') jud.classList.add('wuge-banji');
        else if (j.level === '凶') jud.classList.add('wuge-xiong');
        else if (j.level === '大凶') jud.classList.add('wuge-daxiong');
        jud.textContent = j.name + ' (' + j.level + ')';
        row.appendChild(jud);

        card.appendChild(row);
    });

    // 三才配置
    var sancai = wuge.sancai;
    var scRow = document.createElement('div');
    scRow.className = 'wuge-sancai';
    var scLabel = document.createElement('span');
    scLabel.className = 'wuge-label';
    scLabel.textContent = '三才';
    scRow.appendChild(scLabel);
    var scVal = document.createElement('span');
    scVal.className = 'wuge-sancai-config';
    scVal.textContent = sancai.config + ' ' + sancai.judgment;
    scRow.appendChild(scVal);
    card.appendChild(scRow);

    fragment.appendChild(card);
}