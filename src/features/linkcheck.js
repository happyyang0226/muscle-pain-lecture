/* ===== 1단계: 링크 점검(교수용) =====
   - 영상(YouTube): 브라우저에서 바로 점검. 썸네일 그림이 없으면 삭제·비공개 영상으로 본다.
   - 논문·웹 링크: 브라우저 보안상 여기서 열어 볼 수 없어, 점검 프로그램(.py)을 내려받아 내 컴퓨터에서 돌린다. */
(function(){
"use strict";
var esc=MP.esc, PY=@@JSONSTR:features/linkcheck_standalone.py@@, state=null;
function where(at,titles){ return at.map(function(a){ var ch=(titles[a[0]]||a[0]).split(" ")[0];
  return a[1]?'<button type="button" class="btn sm" data-open="'+a[0]+'" data-slide="'+a[1]+'">'+esc(ch+" "+a[1]+". "+a[2])+'</button>':'<span class="tag">'+esc(ch+" · "+a[2])+'</span>'; }).join(" "); }
function render(el){
  el.innerHTML='<div class="wrap"><p class="muted">링크 목록을 불러오는 중…</p></div>';
  MP.data("links").then(function(D){
    var L=D.links, yt={}, notes=L.filter(function(r){ return r.note; });
    L.forEach(function(r){ if(r.yt) (yt[r.yt]=yt[r.yt]||[]).push(r); });
    var ids=Object.keys(yt);
    var h='<div class="wrap"><div class="pg-head"><div><h1>🔗 링크 점검</h1><p class="lead">강의안에 들어 있는 영상·논문·웹 링크가 아직 살아 있는지 확인합니다. 학기 시작 전에 한 번 돌려 보세요.</p></div><button class="btn" data-m2="home">← 처음 화면</button></div>';
    h+='<div class="kpis"><div class="kpi"><b>'+L.length+'</b><span>서로 다른 링크</span></div><div class="kpi"><b>'+ids.length+'</b><span>YouTube 영상</span></div><div class="kpi"><b>'+(L.length-L.filter(function(r){return r.yt;}).length)+'</b><span>논문·웹 링크</span></div><div class="kpi"><b>'+notes.length+'</b><span>출처 검토 권장</span></div></div>';
    h+='<h2>① 영상 링크 점검 (여기서 바로)</h2><div class="panel"><div class="row"><button class="btn primary" id="lcRun">영상 '+ids.length+'개 점검 시작</button><span id="lcProg" class="small muted" aria-live="polite"></span></div><div class="bar" style="margin-top:10px"><i id="lcBar" style="width:0"></i></div><div id="lcOut"></div></div>';
    h+='<h2>② 논문·웹 링크 점검 (내 컴퓨터에서)</h2><div class="panel info"><p style="margin:0 0 8px">논문·학회 사이트는 브라우저 보안 규칙 때문에 이 화면에서 열어 볼 수 없습니다. 아래 점검 프로그램을 내려받아 <b>인터넷에 연결된 컴퓨터</b>에서 <code>python 링크점검.py</code>로 실행하면, 모든 링크('+L.length+'개)를 열어 보고 <b>깨진 링크가 맨 위에 오는 보고서(.html·.csv)</b>를 만듭니다. 파이썬 3만 있으면 됩니다.</p><div class="row"><button class="btn" id="lcPy">⬇ 점검 프로그램(.py)</button><button class="btn" id="lcCsv">⬇ 링크 목록(.csv)</button></div></div>';
    h+='<h2>③ 출처 검토 권장 링크 '+notes.length+'개</h2><p class="small muted">열리기는 하지만 원 출처가 아니거나 오래 유지되기 어려운 주소입니다. DOI나 학술지 주소로 바꾸면 훨씬 오래 갑니다.</p><div class="tbwrap"><table class="tb"><tr><th>주소</th><th>이유</th><th>쓰인 곳</th></tr>'+notes.map(function(r){ return '<tr><td style="word-break:break-all"><a href="'+esc(r.u)+'" target="_blank" rel="noopener">'+esc(r.u)+'</a></td><td>'+esc(r.note)+'</td><td>'+where(r.at,D.titles)+'</td></tr>'; }).join("")+'</table></div></div>';
    el.innerHTML=h;
    if(state&&state.done) showResult(el,state,D);
    el.querySelector("#lcRun").onclick=function(){ runYT(el,ids,yt,D); };
    el.querySelector("#lcPy").onclick=function(){ MP.download("링크점검.py",PY.replace("__LINKS__",JSON.stringify({titles:D.titles,links:L})),"text/x-python"); };
    el.querySelector("#lcCsv").onclick=function(){ var rows=[["주소","YouTube ID","검토 메모","쓰인 곳"]].concat(L.map(function(r){ return [r.u,r.yt||"",r.note||"",r.at.map(function(a){ return (D.titles[a[0]]||a[0]).split(" ")[0]+" "+a[1]+"번 "+a[2]; }).join("; ")]; }));
      MP.download("링크목록_"+MP.stamp()+".csv","﻿"+rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(","); }).join("\r\n"),"text/csv"); };
  });
}
function runYT(el,ids,yt,D){
  var btn=el.querySelector("#lcRun"), prog=el.querySelector("#lcProg"), bar=el.querySelector("#lcBar");
  if(navigator.onLine===false){ prog.textContent="인터넷에 연결되어 있지 않습니다. 연결한 뒤 다시 누르세요."; return; }
  btn.disabled=true; state={bad:[],ok:0,done:false}; var i=0, fin=0, N=ids.length;
  function next(){ if(i>=N) return; var id=ids[i++], img=new Image(), t=setTimeout(function(){ end(false,"응답 없음"); },15000), over=false;
    function end(ok,why){ if(over) return; over=true; clearTimeout(t); if(ok) state.ok++; else state.bad.push({id:id,why:why,refs:yt[id]}); fin++;
      prog.textContent=fin+" / "+N+" 확인 · 의심 "+state.bad.length+"개"; bar.style.width=Math.round(fin/N*100)+"%";
      if(fin===N){ state.done=true; btn.disabled=false; btn.textContent="다시 점검"; showResult(el,state,D); MP.say("영상 점검 완료. 의심 "+state.bad.length+"개"); } else next(); }
    img.onload=function(){ end(img.naturalWidth>120,"썸네일 없음(삭제·비공개 의심)"); };
    img.onerror=function(){ end(false,"썸네일 없음(삭제·비공개 의심)"); };
    img.referrerPolicy="no-referrer"; img.src="https://i.ytimg.com/vi/"+id+"/mqdefault.jpg"; }
  for(var k=0;k<8;k++) next();
}
function showResult(el,st,D){ var out=el.querySelector("#lcOut"); if(!out) return;
  if(st.ok===0&&st.bad.length){ out.innerHTML='<div class="panel warn">영상을 하나도 확인하지 못했습니다. 인터넷 연결이나 학교 방화벽(YouTube 차단)을 확인하세요.</div>'; return; }
  if(!st.bad.length){ out.innerHTML='<div class="panel ok">모든 영상('+st.ok+'개)이 살아 있습니다.</div>'; return; }
  out.innerHTML='<p style="margin:12px 0 6px"><b>삭제·비공개가 의심되는 영상 '+st.bad.length+'개</b> — 눌러서 직접 확인하고, 아니면 다른 영상으로 바꾸세요(✏️ 수정 기능으로 링크 글을 고칠 수 있습니다).</p><div class="tbwrap"><table class="tb"><tr><th>영상</th><th>판정</th><th>쓰인 곳</th></tr>'+st.bad.map(function(b){
    return '<tr><td><a href="https://www.youtube.com/watch?v='+esc(b.id)+'" target="_blank" rel="noopener">'+esc(b.id)+'</a></td><td>'+esc(b.why)+'</td><td>'+b.refs.map(function(r){ return where(r.at,D.titles); }).join(" ")+'</td></tr>'; }).join("")+'</table></div>'; }
var el=MP.page("linkcheck","링크 점검",render);
el.addEventListener("click",function(e){ var b=e.target.closest("[data-open]"); if(b){ MP.show(b.getAttribute("data-open"),+b.getAttribute("data-slide")); return; } var h=e.target.closest("[data-m2]"); if(h) MP.show(h.getAttribute("data-m2")); });
})();
