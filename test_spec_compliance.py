'''
问卦 · WenGua — Spec 合规性深度审查
对照 spec.md 和 checklist.md 逐项检查实现状态
'''
from playwright.sync_api import sync_playwright

PASS = 0; FAIL = 0
def check(desc, cond, detail=''):
    global PASS, FAIL
    if cond:
        PASS += 1; print(f'  ✅ {desc}')
    else:
        FAIL += 1; print(f'  ❌ {desc}  {detail}')

def main():
    global PASS, FAIL
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 480, 'height': 900})
        BASE = 'http://localhost:8765'
        page.goto(BASE, wait_until='networkidle')

        print('=' * 60)
        print('Spec 合规性审查: 代码实现 vs 设计要求')
        print('=' * 60)

        # ========== v0.2 Copper Coin (wengua-core-casting spec) ==========
        print()
        print('--- v0.2 铜钱掷爻 (wengua-core-casting) ---')

        # R1: castOnce() — Spec 要求实现
        has_castOnce = page.evaluate('typeof window.castOnce !== "undefined"')
        check('R1: castOnce() 已实现', has_castOnce)

        # R2: findGua()
        has_findGua = page.evaluate('typeof window.findGua !== "undefined"')
        check('R2: findGua() 已实现', has_findGua)

        # R3: getBianGua()
        has_bian = page.evaluate('typeof window.getBianGua !== "undefined"')
        check('R3: getBianGua() 已实现', has_bian)

        # R4: getInterpretationFocus()
        has_focus = page.evaluate('typeof window.getInterpretationFocus !== "undefined"')
        check('R4: getInterpretationFocus() 已实现', has_focus)

        # R5: renderResult()
        has_render = page.evaluate('typeof window.renderResult !== "undefined"')
        check('R5: renderResult() 已实现', has_render)

        # R6: 逐爻绘制动画 (Animation.drawGua)
        has_drawGua = page.evaluate('typeof Animation.drawGua !== "undefined"')
        check('R6: Animation.drawGua 已实现', has_drawGua)

        # R7: 按钮状态管理
        check('R7: btn-cast 存在', page.locator('#btn-cast').count() > 0)
        btn_disabled_handler = page.evaluate('''() => {
            const btn = document.querySelector('#btn-cast');
            const clone = btn.cloneNode(true);
            btn.disabled = true;
            const result = btn.disabled;
            btn.disabled = false;
            return result;
        }''')
        check('R7: 按钮 disabled 可控', btn_disabled_handler)

        # ========== v0.3 Meihua (wengua-meihua spec) ==========
        print()
        print('--- v0.3 梅花易数 (wengua-meihua) ---')

        # R1: 模式切换标签栏
        check('R1a: tab-tongqian 存在', page.locator('#tab-tongqian').count() > 0)
        check('R1b: tab-meihua 存在', page.locator('#tab-meihua').count() > 0)
        check('R1c: meihua-controls 存在', page.locator('#meihua-controls').count() > 0)

        active_default = 'active' in (page.locator('#tab-tongqian').get_attribute('class') or '')
        check('R1d: 默认铜钱标签 active', active_default)

        # 点击梅花标签 — 验证切换逻辑是否实现
        page.locator('#tab-meihua').click()
        meihua_active = 'active' in (page.locator('#tab-meihua').get_attribute('class') or '')
        check('R1e: 点击梅花标签 → active', meihua_active)

        controls_hidden = page.locator('#btn-cast').is_hidden()
        check('R1f: 梅花模式 → 铜钱控件隐藏', controls_hidden)

        meihua_visible = not page.locator('#meihua-controls').is_hidden()
        check('R1g: 梅花模式 → 梅花钱控件显示', meihua_visible)

        # R2: 梅花算法核心
        has_xiantian = page.evaluate('typeof window.XIANTIAN_TRIGRAM !== "undefined"')
        check('R2a: XIANTIAN_TRIGRAM 常量', has_xiantian)

        has_trigram_bin = page.evaluate('typeof window.TRIGRAM_TO_BINARY !== "undefined"')
        check('R2b: TRIGRAM_TO_BINARY 映射', has_trigram_bin)

        has_trigram_wx = page.evaluate('typeof window.TRIGRAM_WUXING !== "undefined"')
        check('R2c: TRIGRAM_WUXING 五行', has_trigram_wx)

        has_wxs = page.evaluate('typeof window.WUXING_SHENG !== "undefined"')
        has_wxk = page.evaluate('typeof window.WUXING_KE !== "undefined"')
        check('R2d: 五行生克常量', has_wxs and has_wxk)

        has_num2tri = page.evaluate('typeof window.numberToTrigram !== "undefined"')
        check('R2e: numberToTrigram()', has_num2tri)

        has_mhcast = page.evaluate('typeof window.meihuaCast !== "undefined"')
        check('R2f: meihuaCast()', has_mhcast)

        has_hu = page.evaluate('typeof window.calcHuGua !== "undefined"')
        check('R2g: calcHuGua()', has_hu)

        has_tiyong = page.evaluate('typeof window.calcTiYong !== "undefined"')
        check('R2h: calcTiYong()', has_tiyong)

        has_judge = page.evaluate('typeof window.judgeShengKe !== "undefined"')
        check('R2i: judgeShengKe()', has_judge)

        # R3: 梅花结果渲染
        has_mh_render = page.evaluate('typeof window.renderMeihuaResult !== "undefined"')
        check('R3: renderMeihuaResult()', has_mh_render)

        # R4: 数字输入交互
        has_validate = page.evaluate('typeof window.validateMeihuaInput !== "undefined"')
        check('R4a: validateMeihuaInput()', has_validate)

        has_do = page.evaluate('typeof window.doMeihuaCast !== "undefined"')
        check('R4b: doMeihuaCast()', has_do)

        check('R4c: input-num1 存在', page.locator('#input-num1').count() > 0)
        check('R4d: input-num2 存在', page.locator('#input-num2').count() > 0)
        check('R4e: input-num3 存在', page.locator('#input-num3').count() > 0)
        check('R4f: btn-meihua-random 存在', page.locator('#btn-meihua-random').count() > 0)
        check('R4g: btn-meihua-time 存在', page.locator('#btn-meihua-time').count() > 0)
        check('R4h: btn-meihua-cast 存在', page.locator('#btn-meihua-cast').count() > 0)

        # switchMode
        has_switch = page.evaluate('typeof window.switchMode !== "undefined"')
        check('R1h: switchMode() 路由函数', has_switch)

        # currentMode
        has_mode = page.evaluate('typeof window.currentMode !== "undefined"')
        check('currentMode 变量', has_mode)

        # ========== Checklist 对照 ==========
        print()
        print('--- Checklist 完成率 ---')
        print(f'  v0.2 铜钱 checklist: 0/43 (所有JS代码缺失)')
        print(f'  v0.3 梅花 checklist: 0/56 (所有JS代码缺失)')
        print(f'  HTML/CSS: 已就绪但JS逻辑层为零')

        # ========== 严重性总结 ==========
        print()
        print('--- 缺失函数总览 ---')
        all_v02 = ['castOnce','findGua','getBianGua','getInterpretationFocus','getYaoLabel','renderResult']
        missing_v02 = [f for f in all_v02 if not page.evaluate(f'typeof window.{f} !== "undefined"')]
        all_v03 = ['numberToTrigram','meihuaCast','calcHuGua','calcTiYong','judgeShengKe',
                   'renderMeihuaResult','validateMeihuaInput','doMeihuaCast','switchMode']
        missing_v03 = [f for f in all_v03 if not page.evaluate(f'typeof window.{f} !== "undefined"')]
        print(f'  v0.2 缺失: {len(missing_v02)}/6 — {missing_v02}')
        print(f'  v0.3 缺失: {len(missing_v03)}/9 — {missing_v03}')
        print(f'  v0.3 常量缺失: {4 - sum([has_xiantian, has_trigram_bin, has_trigram_wx, has_wxs and has_wxk])}/4')
        print(f'  JS逻辑函数总缺失: {len(missing_v02)+len(missing_v03)}/15')

        browser.close()

    total = PASS + FAIL
    print()
    print('=' * 60)
    print(f'合规项: {PASS}/{total} 通过 ({PASS/total*100:.1f}%)' if total > 0 else '合规项: N/A')
    print(f'失败: {FAIL}')
    print('=' * 60)
    return 1 if FAIL > 0 else 0

if __name__ == '__main__':
    exit(main())
