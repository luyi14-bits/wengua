'''
问卦 · WenGua v0.3 — 严格验收测试
三层覆盖：Kent Beck（单元逻辑）+ Brian Okken（架构） + Simon Stewart（E2E）
'''
from playwright.sync_api import sync_playwright
import time, sys

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
        logs = []
        page.on('console', lambda msg: logs.append(f'[{msg.type}] {msg.text}'))
        page.on('pageerror', lambda err: logs.append(f'[PAGE_ERROR] {err}'))

        BASE = 'http://localhost:8765'

        # ============================================================
        print('=' * 60)
        print('Phase 1: 页面加载 + 铜钱模式初始状态')
        print('=' * 60)
        page.goto(BASE, wait_until='networkidle')

        check('页面标题', page.title() == '问卦 · WenGua', f'"{page.title()}"')
        check('#btn-cast 存在', page.locator('#btn-cast').count() > 0)
        check('铜钱标签 active', 'active' in (page.locator('#tab-tongqian').get_attribute('class') or ''))
        check('梅花标签非active', 'active' not in (page.locator('#tab-meihua').get_attribute('class') or ''))
        check('铜钱控件可见', not page.locator('#btn-cast').is_hidden())
        check('梅花控件隐藏', page.locator('#meihua-controls').is_hidden())
        check('placeholder存在', '静心凝神' in page.locator('.placeholder').inner_text())
        check('无console error',
              len([l for l in logs if '[PAGE_ERROR]' in l]) == 0,
              f'errors: {[l for l in logs if "[PAGE_ERROR]" in l]}')

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 2: 铜钱模式 — 按钮能正常工作吗？')
        print('=' * 60)
        logs.clear()

        # Spec R7 要求: v0.2 铜钱模式完整回归
        # 但 app.js 是空壳...
        page.locator('#btn-cast').click()
        time.sleep(0.5)

        errors_now = [l for l in logs if '[PAGE_ERROR]' in l]
        check('铜钱按钮点击无报错', len(errors_now) == 0, f'{errors_now}')
        check('铜钱单击无功能产出(空壳)',
              page.locator('#gua-name').inner_text().strip() == '',
              f'实际有内容: "{page.locator("#gua-name").inner_text()}"')

        # 验证 app.js 中缺失了哪些关键函数
        missing_funcs = []
        for fn in ['castOnce', 'findGua', 'getBianGua', 'getInterpretationFocus', 'getYaoLabel', 'renderResult']:
            exists = page.evaluate(f'typeof window.{fn} !== "undefined"')
            if not exists:
                missing_funcs.append(fn)
        check(f'铜钱模式函数缺失数={len(missing_funcs)}',
              len(missing_funcs) > 0,  # 预期缺失
              f'缺失函数: {missing_funcs}')

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 3: 模式切换')
        print('=' * 60)
        logs.clear()

        # 3.1 点击梅花标签
        page.locator('#tab-meihua').click()
        time.sleep(0.3)

        check('切换后梅花标签active', 'active' in (page.locator('#tab-meihua').get_attribute('class') or ''))
        check('铜钱控件隐藏', page.locator('#btn-cast').is_hidden())
        check('梅花控件显示', not page.locator('#meihua-controls').is_hidden())
        check('placeholder恢复', '静心凝神' in page.locator('.placeholder').inner_text())
        check('结果区隐藏', 'hidden' in (page.locator('#result').get_attribute('class') or ''))

        # 3.2 切换回铜钱
        page.locator('#tab-tongqian').click()
        time.sleep(0.3)

        check('切回铜钱标签active', 'active' in (page.locator('#tab-tongqian').get_attribute('class') or ''))
        check('铜钱控件显示', not page.locator('#btn-cast').is_hidden())
        check('梅花控件隐藏', page.locator('#meihua-controls').is_hidden())

        # 3.3 快速切换 5 次
        for _ in range(4):
            page.locator('#tab-meihua').click()
            time.sleep(0.2)
            page.locator('#tab-tongqian').click()
            time.sleep(0.2)

        errors_switch = [l for l in logs if '[PAGE_ERROR]' in l]
        check('5次切换无JS error', len(errors_switch) == 0, f'{errors_switch}')

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 4: 梅花易数模式输入验证')
        print('=' * 60)
        page.locator('#tab-meihua').click()
        time.sleep(0.3)
        logs.clear()

        # 4.1 检查输入框和按钮
        check('上卦数输入框存在', page.locator('#input-num1').count() > 0)
        check('下卦数输入框存在', page.locator('#input-num2').count() > 0)
        check('动爻数输入框存在', page.locator('#input-num3').count() > 0)
        check('🎲随机数字按钮存在', page.locator('#btn-meihua-random').count() > 0)
        check('🕐用当前时间按钮存在', page.locator('#btn-meihua-time').count() > 0)
        check('起卦按钮存在', page.locator('#btn-meihua-cast').count() > 0)

        # 4.2 验证梅花算法函数是否缺失
        missing_meihua = []
        for fn in ['numberToTrigram', 'meihuaCast', 'calcHuGua', 'calcTiYong', 'judgeShengKe', 'renderMeihuaResult']:
            exists = page.evaluate(f'typeof window.{fn} !== "undefined"')
            if not exists:
                missing_meihua.append(fn)
        check(f'梅花算法函数缺失数={len(missing_meihua)}',
              len(missing_meihua) > 0,
              f'缺失函数: {missing_meihua}')

        # 4.3 试试空值起卦（预期：无法执行）
        page.locator('#btn-meihua-cast').click()
        time.sleep(0.3)

        check('空值起卦无console报错',
              len([l for l in logs if '[PAGE_ERROR]' in l]) == 0,
              f'{logs}')

        check('空值起卦无结果产生产生result未hidden',
              'hidden' in (page.locator('#result').get_attribute('class') or ''),
              'result hidden状态: ' + str(page.locator('#result').get_attribute('class')))

        # 4.4 检查 switchMode 函数
        has_switch = page.evaluate('typeof window.switchMode !== "undefined"')
        check('switchMode 函数缺失', not has_switch, 'expected missing (app.js is empty stub)')

        # 4.5 TIYONG 常量
        has_constants = page.evaluate('''typeof window.XIANTIAN_TRIGRAM !== "undefined"
            || typeof window.TRIGRAM_WUXING !== "undefined"
            || typeof window.TRIGRAM_TO_BINARY !== "undefined"''')
        check('梅花常量缺失', not has_constants, 'expected missing')

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 5: CSS 样式验证')
        print('=' * 60)

        # 5.1 检查关键样式是否定义
        css_rules = page.evaluate('''() => {
            const sheets = document.styleSheets;
            const rules = [];
            for (const s of sheets) {
                try {
                    for (const r of s.cssRules || []) rules.push(r.selectorText);
                } catch(e) {}
            }
            return rules;
        }''')

        for sel in ['.mode-tab', '.mode-tab.active', '.meihua-input-group', '.tiyong-level-5',
                     '.tiyong-level-1', '.btn-aux', '#gua-display.meihua-mode', '.meihua-trigram']:
            found = any(sel in r for r in css_rules)
            check(f'CSS有 {sel}', found)

        # 5.2 输入框 error 样式
        has_error = any('.error' in r for r in css_rules)
        check('CSS有 input.error', has_error)

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 6: animation.js 验证')
        print('=' * 60)

        has_drawGua = page.evaluate('typeof Animation.drawGua !== "undefined"')
        check('Animation.drawGua 存在', has_drawGua)
        if has_drawGua:
            params = page.evaluate('''() => {
                const s = Animation.drawGua.toString();
                const m = s.match(/function\s*\(([^)]*)\)/);
                return m ? m[1].split(',').map(p=>p.trim()) : [];
            }''')
            check(f'drawGua 参数数=2 (container, yao)', len(params) == 2,
                  f'实际参数: {params}')

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 7: gua-data.js 数据完整性')
        print('=' * 60)

        count = page.evaluate('() => GUA_DATA.length')
        check('GUA_DATA 64卦', count == 64, f'实际={count}')
        check('GUA_BY_BINARY 存在', page.evaluate('typeof GUA_BY_BINARY !== "undefined"'))

        ids = page.evaluate('() => GUA_DATA.map(g => g.id).sort((a,b)=>a-b)')
        check('id 1-64 完整', ids == list(range(1,65)), f'异常: ids={ids[:3]}...')

        all_lines = page.evaluate('() => GUA_DATA.every(g => g.lines.length === 6)')
        check('每卦6爻辞', all_lines)

        all_binary = page.evaluate('() => GUA_DATA.every(g => g.binary.length === 6)')
        check('每卦binary=6位', all_binary)

        symbols = page.evaluate('() => GUA_DATA.map(g => g.symbol)')
        check('卦符唯一', len(set(symbols)) == 64)

        # 乾/坤 yong
        qian_yong = page.evaluate('() => GUA_DATA[0].yong')
        kun_yong = page.evaluate('() => GUA_DATA[1].yong')
        check('乾用九', qian_yong and '用九' in qian_yong)
        check('坤用六', kun_yong and '用六' in kun_yong)

        # ============================================================
        print()
        print('=' * 60)
        print('Phase 8: Content-Security-Policy')
        print('=' * 60)

        csp = ''
        for r in page.context.pages[0].request.all():
            pass
        # Read CSP from meta tag
        meta_csp = page.evaluate('''() => {
            const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return meta ? meta.content : null;
        }''')
        check('CSP meta tag 存在', meta_csp is not None)
        if meta_csp:
            check("CSP 不允许外部连接", "'self'" in meta_csp and "connect-src 'none'" in meta_csp)

        # ============================================================
        browser.close()

    print()
    print('=' * 60)
    total = PASS + FAIL
    print(f'总计: {PASS}/{total} 通过 ({PASS/total*100:.1f}%)')
    print(f'失败: {FAIL}')
    print('=' * 60)
    return 1 if FAIL > 0 else 0

if __name__ == '__main__':
    sys.exit(main())
