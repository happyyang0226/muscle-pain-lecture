# ---- 2단계: 복습 · 오개념 노트 · 모의고사 ----
ev("""() => { const ans={},conf={}; for(let i=0;i<20;i++){ ans[i]=i%3; conf[i]=i%2?0:1; } localStorage.setItem('ch1-quiz-v1',JSON.stringify({i:0,ans,conf,done:true})); localStorage.removeItem('mp-study-v1'); localStorage.setItem('mp-lastbackup',String(Date.now())); }""")
home(); page.wait_for_timeout(900)
check(page.locator("#homeAlert .home-alert.go").count() == 1, "처음 화면에 '오늘 복습할 문항' 알림")
go("review"); page.wait_for_selector("#rvStart", timeout=8000)
due = int(page.locator(".kpi b").first.inner_text())
truth = ev("""async () => { const b = await MP.qbank(); const q=b.mods.ch1.q; const st=JSON.parse(localStorage.getItem('ch1-quiz-v1'));
  return Object.keys(st.ans).filter(k => !(st.ans[k]===q[k].a && st.conf[k]===0)).length; }""")
check(due == truth, f"오늘 복습 수 = 장 퀴즈에서 틀리거나 확신 없던 문항 수 ({due}={truth})")
page.click("#rvStart"); page.click(".opt >> nth=0"); page.click("[data-c='0']"); page.click("#rvCheck")
check(page.locator(".fb").count() == 1, "복습 문항 정답 확인 후 해설 표시")
st = ev("() => JSON.parse(localStorage.getItem('mp-study-v1'))")
it = [v for v in st["items"].values() if v["hist"]]
check(len(it) == 1 and it[0]["due"] > 0, "복습 결과 기록과 다음 복습 날짜 저장")
page.click('[data-view="mis"]'); page.wait_for_timeout(200)
counts = [int(x) for x in page.locator(".quad b").all_inner_texts()]
check(sum(counts) == 20, f"오개념 노트 4분면 합계 20 ({counts})")
page.click('[data-view="mock"]'); page.click("#mkGo"); page.wait_for_timeout(200)
n = page.locator(".dots button").count()
check(n == 40, f"모의고사 40문항 생성 ({n})")
areas = ev("""async () => { const b=await MP.qbank(); return Object.keys(b.areas).length; }""")
for i in range(5):
    page.click(".opt >> nth=0"); page.click("#mkNx")
page.click("#mkEnd"); page.click("#mkEnd"); page.wait_for_timeout(300)
rows = page.locator("table.tb").first.locator("tr").count()
check(rows >= 6, f"모의고사 결과에 국시 영역별 표 ({rows}개 영역)")
check(len(ev("() => JSON.parse(localStorage.getItem('mp-study-v1')).mocks")) == 1, "모의고사 기록 저장")
bad = ev("""async () => { const b=await MP.qbank(); const out=[]; for(const m in b.mods) for(const q of b.mods[m].q){ if(!b.areas[q.area]) out.push(q.id); } return out; }""")
check(not bad, "모든 문항에 국시 영역 태그")

extra3 = os.path.join(os.path.dirname(os.path.abspath(URL.replace("file://", ""))), "..", "tools", "test_features3.py")
if os.path.exists(extra3):
    exec(open(extra3, encoding="utf-8").read())
check(not errs, "새 기능 화면 전체 페이지 오류 0개" + ("" if not errs else f" — {errs[:3]}"))
