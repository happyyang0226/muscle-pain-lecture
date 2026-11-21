#!/usr/bin/env python3
"""배포 파일 자동 점검. 고친 뒤 build.py 다음에 돌린다.

python3 tools/test.py [dist 파일]

점검 내용
 1. 자료 점검: 퀴즈마다 보기 5개·정답 하나, 장 안의 공통 코드 자리표시가 모두 채워지는지
 2. 브라우저 점검(Chrome): 모든 장이 열리고 슬라이드가 보이는지, 페이지 오류 0개
 3. 오래된 브라우저 흉내(DecompressionStream 없음)에서도 장이 열리는지
 4. 새 기능 화면(복습·모의고사·증례·분석·퀴즈 편집)이 오류 없이 그려지는지
 5. 노트 백업 → 지우기 → 불러오기 왕복, 휴대폰 너비(390px) 화면
"""
import json, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, "dist", "근육기원통증_웹앱.html")
URL = "file://" + DIST
CHROME = "/usr/bin/google-chrome"
FAIL = []

def check(ok, msg):
    print(("  ✔ " if ok else "  ✘ ") + msg)
    if not ok:
        FAIL.append(msg)

# ---------- 1. 자료 점검 ----------
print("1. 자료 점검")
qb = json.loads(subprocess.check_output(["node", os.path.join(ROOT, "tools", "qbank.js"), "--dump"], cwd=ROOT))
for k, v in qb["mods"].items():
    bad = [i + 1 for i, q in enumerate(v["Q"]) if len(q["o"]) != 5 or not (0 <= q["a"] < 5) or len(set(q["o"])) != 5]
    check(not bad, f"{k}: 퀴즈 {len(v['Q'])}문항 형식" + (f" — 문제 있는 문항 {bad}" if bad else ""))
order = json.load(open(os.path.join(ROOT, "src", "data", "module-order.json")))
common = set(os.listdir(os.path.join(ROOT, "src", "common")))
for k in order:
    t = open(os.path.join(ROOT, "src", "modules", k + ".html"), encoding="utf-8").read()
    miss = [n for n in re.findall(r"@@C:([\w.-]+)@@", t) if n not in common]
    check(not miss, f"{k}: 공통 코드 자리표시" + (f" 없음 {miss}" if miss else ""))

def watch(page, errs):
    page.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    page.on("console", lambda m: m.type == "error" and not re.search(r"youtube|ERR_|net::|Failed to load resource|favicon", m.text) and errs.append("console: " + m.text))

def open_mod(page, k):
    page.click(f'.tab[data-m="{k}"]')
    page.wait_for_function(f"""() => {{ const f=[...document.querySelectorAll('#stage iframe')].find(x=>x.title&&!x.hidden);
        return f && f.contentDocument && f.contentDocument.readyState==='complete' && f.contentDocument.body && f.contentDocument.body.children.length>0; }}""", timeout=20000)
    return page.frames[-1]

with sync_playwright() as p:
    br = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])

    # ---------- 2. 모든 장 ----------
    print("2. 모든 장 열기")
    ctx = br.new_context(viewport={"width": 1366, "height": 860})
    page = ctx.new_page(); errs = []; watch(page, errs)
    page.goto(URL); page.wait_for_selector("#home:not([hidden])")
    check(page.locator(".card").count() >= 10, "처음 화면 카드")
    for k in order:
        page.click("#homeBtn")
        page.click(f'.tab[data-m="{k}"]')
        page.wait_for_function(f"""() => {{ const f=[...document.querySelectorAll('#stage iframe')].find(x=>!x.hidden);
            return f && f.contentDocument && f.contentDocument.readyState==='complete' && f.contentDocument.title; }}""", timeout=20000)
        n = page.evaluate("""() => { const f=[...document.querySelectorAll('#stage iframe')].find(x=>!x.hidden); const d=f.contentDocument;
            return {slides:d.querySelectorAll('section.slide').length, title:d.title, left:(d.documentElement.outerHTML.match(/@@C:/g)||[]).length}; }""")
        check((n["slides"] > 0 or k == "finder") and n["left"] == 0, f"{k}: '{n['title']}' 슬라이드 {n['slides']}장")
    check(not errs, "페이지 오류 0개" + ("" if not errs else f" — {errs[:3]}"))

    # ---------- 3. 오래된 브라우저 ----------
    print("3. DecompressionStream 없는 브라우저")
    c2 = br.new_context(); c2.add_init_script("delete window.DecompressionStream; delete window.CompressionStream;")
    p2 = c2.new_page(); e2 = []; watch(p2, e2); p2.goto(URL)
    p2.click('.tab[data-m="ch3"]')
    p2.wait_for_function("() => { const f=document.querySelector('#stage iframe'); return f && f.contentDocument && f.contentDocument.querySelectorAll('section.slide').length>0; }", timeout=20000)
    check(not e2, "예비 해제기로 3장 열림" + ("" if not e2 else f" — {e2[:2]}"))
    c2.close()

    # ---------- 4. 새 기능 화면 ----------
    print("4. 새 기능 화면")
    extra = os.path.join(ROOT, "tools", "test_features.py")
    if os.path.exists(extra):
        exec(open(extra, encoding="utf-8").read(), {"page": page, "ctx": ctx, "br": br, "URL": URL, "check": check, "watch": watch, "errs": errs, "open_mod": open_mod})

    # ---------- 5. 휴대폰 너비 ----------
    print("5. 휴대폰 너비 390px")
    c3 = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    p3 = c3.new_page(); e3 = []; watch(p3, e3); p3.goto(URL)
    sw = p3.evaluate("document.documentElement.scrollWidth")
    check(sw <= 392, f"가로 넘침 없음 (scrollWidth {sw})")
    p3.screenshot(path=os.path.join(ROOT, "dist", "shot_mobile_home.png"))
    check(not e3, "휴대폰 화면 오류 0개")
    c3.close()
    page.screenshot(path=os.path.join(ROOT, "dist", "shot_last.png"))
    br.close()

print("\n결과:", "모두 통과" if not FAIL else f"{len(FAIL)}건 실패")
for f in FAIL:
    print("  -", f)
sys.exit(1 if FAIL else 0)
