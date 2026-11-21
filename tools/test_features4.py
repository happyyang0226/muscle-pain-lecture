# ---- 4단계: 증례 · 근육 역방향 퀴즈 · 퀴즈 편집 · 결과 코드 분석 ----
import re as _re
home()
# 증례: 첫 증례를 정답만 골라 끝까지
cases = ev("async () => (await MP.data('cases')).cases")
check(len(cases) >= 4, f"증례 {len(cases)}개")
c0 = cases[0]
go("cases"); page.wait_for_selector("[data-case]", timeout=8000)
page.click(f'[data-case="{c0["id"]}"]')
for si, stp in enumerate(c0["steps"]):
    # 첫 단계는 일부러 틀려 보기(설명이 뜨는지)
    if si == 0:
        wrong = [i for i, o in enumerate(stp["opts"]) if not o["ok"]][0]
        page.click(f'.case-step:not(.done) .opt[data-o="{wrong}"]'); page.click("#csOk")
        check(page.locator(".case-step:not(.done) .opt.wrong small").count() >= 1, "증례: 틀린 선택에 이유 설명")
        page.click(f'.case-step:not(.done) .opt[data-o="{wrong}"]')  # 다중 선택 해제
    for i, o in enumerate(stp["opts"]):
        if o["ok"]:
            page.click(f'.case-step:not(.done) .opt[data-o="{i}"]')
    page.click("#csOk"); page.wait_for_timeout(80)
st = ev("() => JSON.parse(localStorage.getItem('mp-cases-v1')).c")[c0["id"]]
check(st["done"] and st["score"] == len(c0["steps"]) - 1, f"증례 완료 · 첫 시도 점수 {st['score']}/{len(c0['steps'])} (1단계는 일부러 틀림)")
check("핵심 정리" in page.inner_text("#pg-cases"), "증례 끝에 핵심 정리")
links = [s.get("link") for c in cases for s in c["steps"] if s.get("link") and not s["link"].get("finder")]
ix = ev("async () => (await MP.data('course-index')).map(x => x.c + ':' + x.n)")
badl = [f'{l["c"]}:{l["n"]}' for l in links if f'{l["c"]}:{l["n"]}' not in ix]
check(not badl, f"증례의 슬라이드 연결 {len(links)}개가 모두 실제 슬라이드" + (f" — 없음 {badl}" if badl else ""))

# 근육 역방향 퀴즈
fr = open_mod(page, "finder")
fr.click('[data-mode="quiz"]'); page.wait_for_timeout(200)
check(fr.evaluate("getComputedStyle(document.querySelector('main')).display") == "none", "역방향 퀴즈 모드에서 찾기 화면 숨김")
m = fr.evaluate("__fq.cur().m.n")
f0 = fr.evaluate("(() => { const f = __fq.cur().m.figs.find(f => (f.ref||[]).length); return f.ref[0]; })()")
box = fr.locator(".fqmaps svg").first.bounding_box()
vb = fr.evaluate("(() => { const b = document.querySelector('.fqmaps svg').viewBox.baseVal; return {x:b.x, y:b.y, width:b.width, height:b.height}; })()")
sx = box["width"] / vb["width"]; sy = box["height"] / vb["height"]
page.mouse.click(box["x"] + (f0[0] - vb["x"]) * sx, box["y"] + (f0[1] - vb["y"]) * sy)
fr.click("#fqCheck"); page.wait_for_timeout(150)
check("1곳" in fr.inner_text(".fqfb") or "찾았고" in fr.inner_text(".fqfb"), f"부위 찍기 채점 ({m})")
check(fr.evaluate("JSON.parse(localStorage.getItem('mp-fq-v1')).n") >= 1, "역방향 퀴즈 기록 저장")
fr.evaluate("__fq.setType('name')"); page.wait_for_timeout(100)
check(fr.locator(".fqopts button").count() == 5, "근육 맞히기 보기 5개")
fr.click("#fqNext") if fr.locator("#fqNext").count() else None
fr.click('[data-mode="find"]')
fr.click('#regs button >> nth=0'); page.wait_for_timeout(300)
fr.click('.cand >> nth=0'); page.wait_for_timeout(600)
check(fr.locator(".chs2 button").count() >= 1, "근육 상세에 강의안 슬라이드 바로가기")
fr.click(".chs2 button >> nth=0"); page.wait_for_timeout(1200)
cur = ev("MP.cur()")
check(_re.match(r"ch\d", cur or "") is not None, f"슬라이드 바로가기로 해당 장 열림 ({cur})")

# 퀴즈 편집 → 장 퀴즈·문제은행 반영 → 수정본에 포함
home(); go("qedit"); page.wait_for_selector("[data-open]", timeout=8000)
page.click('[data-open="0"]'); page.fill("#qeS", "편집 점검 문항: 근육 유해수용 섬유는?"); page.click("#qeSave"); page.wait_for_timeout(300)
check(ev("async () => (await MP.qbank()).mods.ch1.q[0].s").startswith("편집 점검"), "편집이 문제은행(복습·모의고사)에 반영")
check(ev("async () => (await MP.qbank()).mods.final.q.find(q => q.same==='ch1-1').s").startswith("편집 점검"), "장 문항 편집이 종합평가 같은 문항에도 반영")
fr = open_mod(page, "ch1")
fr.evaluate("document.dispatchEvent(new CustomEvent('quizgoto',{detail:0}))"); page.wait_for_timeout(200)
check("편집 점검" in fr.evaluate("document.getElementById('quizIn').textContent"), "편집이 1장 퀴즈 화면에 반영")
home()
with page.expect_download(timeout=30000) as d4:
    page.click("#edBake")
bk = "/tmp/_baked_q.html"; d4.value.save_as(bk)
pb = ctx.new_page(); eb = []; watch(pb, eb)
ev("() => localStorage.removeItem('mp-qedit-v1')")
pb.goto("file://" + bk); pb.wait_for_timeout(500)
check(pb.evaluate("async () => (await MP.qbank()).mods.ch1.q[0].s").startswith("편집 점검") and not eb, "퀴즈 편집이 수정본 파일 안에 들어감(브라우저 기록 없이도)")
pb.close()
ev("() => localStorage.removeItem('mp-qedit-v1')")

# 결과 코드 → 분석
home(); go("review"); page.click('[data-view="code"]'); page.click("#cdMake"); page.wait_for_timeout(200)
code = page.input_value("#cdTxt")
check(code.startswith("MPR1-"), "학생 결과 코드 생성")
P = ev("(c) => { const r = MP.analysis.parse(c + ' ' + c + ' MPR1-abc-ZZZZ'); return [r.list.length, r.dup, r.bad]; }", code)
check(P == [1, 1, 1], f"코드 검사: 사용 1 · 중복 1 · 손상 1 ({P})")
go("analysis"); page.fill("#anIn", code); page.click("#anGo"); page.wait_for_timeout(300)
check("장별" in page.inner_text("#anOut") and "1장" in page.inner_text("#anOut"), "결과 분석 화면(장별·영역별·문항별)")
page.click("#anDemo"); page.wait_for_timeout(400)
check(page.locator("#anOut .qcard").count() >= 5 and page.locator("#anG button").count() == 3, "예시 30명 분석 · 반별 보기")
with page.expect_download() as d5:
    page.click("#anCsv")
import csv as _csv
_rows = list(_csv.reader(open(d5.value.path(), encoding="utf-8-sig", newline="")))
check(len(_rows) == 221, f"문항별 분석표 CSV 220문항 ({len(_rows)-1})")
