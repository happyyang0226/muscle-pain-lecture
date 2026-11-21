# ---- 3단계: 구조 개편 뒤에도 원래 기능이 그대로인지(회귀 점검) ----
home()
fr = open_mod(page, "ch2")
fr.evaluate("window.__study.addMemo('회귀 점검 메모')"); page.wait_for_timeout(400)
check("회귀 점검 메모" in (ev("() => localStorage.getItem('mp-notes-v1:ch2')") or ""), "장 안 메모 → 틀에 저장(장↔틀 메시지)")
res = fr.evaluate("""() => new Promise(r => { addEventListener('message', e => { if(e.data && e.data.lookupRes) r(e.data.lookupRes.length); });
  parent.postMessage({app:'mp', lookup:['연관통'], q:'연관통'}, '*'); setTimeout(() => r(-1), 8000); })""")
check(res > 5, f"과정 전체 용어 찾기 결과 {res}개")
ix = fr.evaluate("""() => new Promise(r => { addEventListener('message', e => { if(e.data && e.data.courseIdx) r(e.data.courseIdx.length); });
  parent.postMessage({app:'mp', courseGet:1}, '*'); setTimeout(() => r(-1), 8000); })""")
check(ix == 261, f"과정 전체 검색 색인 전달 ({ix}개 슬라이드)")
spoof = ev("""() => new Promise(r => { const f = document.createElement('iframe'); f.srcdoc = '<script>parent.postMessage({app:"mp", notesPut:"ch5", notes:{x:{memo:"가짜", ts:1}}}, "*")<\\/script>';
  document.body.appendChild(f); setTimeout(() => { f.remove(); r(localStorage.getItem('mp-notes-v1:ch5') || ''); }, 800); })""")
check("가짜" not in spoof, "모르는 iframe이 보낸 메시지는 무시(출처 확인)")
home()
# 교수 수정 → 수정본 파일 → 다시 열어 반영 확인(압축 재포장·공통 코드 접기)
title = ev("""async () => { const h = await MP.decRaw('ch3'); const doc = new DOMParser().parseFromString(h, 'text/html');
  const s = doc.querySelectorAll('section.slide, .slide')[0]; const sk = MP.EDITC.key(s, 0); const c = MP.EDITC.cands(s, '#quiz,.quiz,[data-noedit]')[0];
  const o = MP.EDITC.hash(MP.EDITC.norm(c)); const e = {}; e[sk] = {0: {o: o, h: '회귀점검 수정 제목'}}; MP.edPut('ch3', e); return c.textContent.trim().slice(0,30); }""")
with page.expect_download(timeout=30000) as d3:
    page.click("#edBake")
baked = "/tmp/_baked_test.html"; d3.value.save_as(baked)
pb = ctx.new_page(); eb = []; watch(pb, eb); pb.goto("file://" + str(baked))
pb.click('.tab[data-m="ch3"]')
pb.wait_for_function("() => { const f=document.querySelector('#stage iframe'); return f && f.contentDocument && f.contentDocument.querySelectorAll('section.slide').length>0; }", timeout=20000)
txt = pb.evaluate("() => document.querySelector('#stage iframe').contentDocument.body.innerHTML.indexOf('회귀점검 수정 제목')")
size = os.path.getsize(baked)
check(txt >= 0 and size < 1.5e6 and not eb, f"수정본 파일에 고친 글 반영 · 압축 유지 ({size/1e6:.2f}MB, 원래 칸 '{title}')")
pb.close()
ev("() => { MP.edPut('ch3', {}); localStorage.removeItem('mp-notes-v1:ch2'); }")

# 자판 글자 필기(🔤 글자, GitHub 최신판 기능)도 그대로인지
home()
fr = open_mod(page, "ch1")
check(fr.evaluate("[...document.querySelectorAll('button')].some(b => b.textContent.indexOf('글자') >= 0)"), "필기 도구에 🔤 글자 버튼")
ev("""() => localStorage.setItem('mp-notes-v1:ch4', JSON.stringify({s1:{i:0,t:'표지',strokes:[{k:'text',p:[120,90],fs:24,tx:'자판 글자 점검',c:'blue',w:2}],ts:Date.now()}}))""")
home(); go("notes"); page.wait_for_timeout(300)
check("자판 글자 점검" in page.inner_html("#npBody"), "내 노트에서 자판 글자 필기 미리보기")
ev("() => localStorage.removeItem('mp-notes-v1:ch4')")

extra4 = os.path.join(os.path.dirname(os.path.abspath(URL.replace("file://", ""))), "..", "tools", "test_features4.py")
if os.path.exists(extra4):
    exec(open(extra4, encoding="utf-8").read())
