# test.py가 불러 쓰는 새 기능 점검(page, ctx, check, errs, open_mod, URL 사용 가능)
import json, os, time

def ev(js, arg=None):
    return page.evaluate(js) if arg is None else page.evaluate(js, arg)

def home():
    page.goto("about:blank"); page.goto(URL); page.wait_for_selector("#home:not([hidden])")

def go(k):
    page.evaluate(f"MP.show('{k}')")
    page.wait_for_timeout(250)

# ---- 1단계: 백업 알림 · 저장 공간 · 백업 v2 왕복 · 접근성 ----
ev("""() => { localStorage.setItem('mp-notes-v1:ch1', JSON.stringify({'s1':{i:0,t:'표지',memo:'테스트 메모',ts:Date.now()}}));
  localStorage.setItem('ch2-quiz-v1', JSON.stringify({i:3,ans:{0:1,1:2},conf:{0:0,1:1},done:false}));
  localStorage.setItem('mp-firstuse', String(Date.now()-10*864e5)); localStorage.removeItem('mp-lastbackup'); }""")
home()
check(page.locator("#homeAlert .home-alert.warn").count() == 1, "백업 알림(10일 동안 백업 없음)이 처음 화면에 뜸")
with page.expect_download() as d:
    page.click("#haBackup")
bk = json.loads(open(d.value.path(), encoding="utf-8").read())
check(bk.get("v") == 2 and "ch2-quiz-v1" in bk.get("extra", {}) and bk["notes"]["ch1"]["s1"]["memo"] == "테스트 메모", "백업 v2에 노트와 퀴즈 기록이 함께 들어감")
check(page.locator("#homeAlert .home-alert.warn").count() == 0, "백업 후 알림 사라짐")
ev("() => { localStorage.removeItem('mp-notes-v1:ch1'); localStorage.removeItem('ch2-quiz-v1'); }")
home(); go("notes")
page.set_input_files("#npImport", d.value.path()); page.wait_for_timeout(400)
check(ev("() => !!localStorage.getItem('ch2-quiz-v1') && JSON.parse(localStorage.getItem('mp-notes-v1:ch1')).s1.memo==='테스트 메모'"), "백업 불러오기로 노트·퀴즈 기록 복원")
check(page.locator("#npCare").inner_text().find("저장된 학습 기록") >= 0, "내 노트에 저장 공간 사용량 표시")
page.set_input_files("#npImport", files=[{"name": "bad.json", "mimeType": "application/json", "buffer": b'{"notes":{"ch1":{"x":null}}}'}]); page.wait_for_timeout(300)
check(ev("() => JSON.parse(localStorage.getItem('mp-notes-v1:ch1')).s1.memo==='테스트 메모'"), "잘못된 백업이 기존 노트를 덮어쓰지 않음")

fr = open_mod(page, "ch1")
check(fr.evaluate("!!document.getElementById('srLive')"), "장 안에 화면낭독 알림 영역(aria-live)")
fr.evaluate("document.getElementById('next').click()"); page.wait_for_timeout(300)
check("슬라이드" in fr.evaluate("document.getElementById('srLive').textContent"), "슬라이드 넘김을 낭독 영역에 알림")

go("linkcheck"); page.wait_for_selector("#lcRun", timeout=8000)
check("YouTube" in page.inner_text("#pg-linkcheck"), "링크 점검 화면")
with page.expect_download() as d2:
    page.click("#lcPy")
py = open(d2.value.path(), encoding="utf-8").read()
check("__LINKS__" not in py and '"links"' in py, "점검 프로그램(.py)에 링크 목록이 들어감")
import subprocess
ok = subprocess.run(["python3", "-c", "import ast,sys;ast.parse(open(sys.argv[1],encoding='utf-8').read())", d2.value.path()]).returncode == 0
check(ok, "점검 프로그램 문법 정상")

extra2 = os.path.join(os.path.dirname(os.path.abspath(URL.replace("file://", ""))), "..", "tools", "test_features2.py")
if os.path.exists(extra2):
    exec(open(extra2, encoding="utf-8").read())
