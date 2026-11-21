/* ===== 4단계: 🩺 증례 임상추론 =====
   d-cases(시나리오)를 단계별로 푼다. 틀리면 그 답의 설명을 보고 다시 고른다(첫 시도만 점수).
   기록: localStorage "mp-cases-v1" = {ts, c:{증례id:{i:지금 단계, first:{단계:0|1}, picks:{단계:[골랐던 것]}, done, score, at}}} */
(function(){
"use strict";
var esc=MP.esc, KEY="mp-cases-v1", D=null, curId=null, pick=[], wrongTry=null, order={};
function load(){ try{ var o=JSON.parse(localStorage.getItem(KEY)||"null"); if(o&&o.c) return o; }catch(e){} return {ts:0,c:{}}; }
var S=load(); function save(){ S.ts=Date.now(); try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function st(id){ return S.c[id]||(S.c[id]={i:0,first:{},picks:{},done:false,score:0}); }
function shuffle(n){ var a=[]; for(var i=0;i<n;i++) a.push(i); for(var j=a.length-1;j>0;j--){ var k=Math.floor(Math.random()*(j+1)), t=a[j]; a[j]=a[k]; a[k]=t; } return a; }
function ordOf(cid,si,n){ var k=cid+":"+si; return order[k]||(order[k]=shuffle(n)); }
function linkBtn(l){ if(!l) return ""; if(l.finder) return '<button type="button" class="btn sm" data-go="finder">🧭 '+esc(l.label)+'</button>';
  return '<button type="button" class="btn sm" data-go="ch'+l.c+'" data-slide="'+l.n+'">📖 '+esc(l.label)+' ('+l.n+'번)</button>'; }
MP.cases={state:function(){ return S; }};

var el=MP.page("cases","증례 임상추론",function(root,arg){ if(arg&&typeof arg==="string") curId=arg; draw(); });
function draw(){ el.innerHTML='<div class="wrap"><p class="muted">증례를 불러오는 중…</p></div>';
  MP.data("cases").then(function(d){ D=d; if(curId&&!D.cases.some(function(c){ return c.id===curId; })) curId=null; curId?drawCase():drawList(); }); }
function drawList(){ var h='<div class="wrap"><div class="pg-head"><div><h1>🩺 증례 임상추론</h1><p class="lead">환자를 만난 순서대로 <b>문진 → 적신호 → 기전 추론 → 촉진·원인 근육 → 중재 → 재평가</b>를 직접 골라 봅니다. 틀리면 그 선택이 왜 문제인지 보고 다시 고를 수 있고, 첫 시도에 맞힌 단계만 점수가 됩니다.</p></div></div>';
  var done=D.cases.filter(function(c){ return S.c[c.id]&&S.c[c.id].done; }).length;
  h+='<div class="kpis"><div class="kpi"><b>'+D.cases.length+'</b><span>증례</span></div><div class="kpi"><b>'+done+'</b><span>끝낸 증례</span></div></div><div class="grid">';
  D.cases.forEach(function(c){ var s=S.c[c.id], status=!s?"시작 전":(s.done?"완료 · 첫 시도 "+s.score+"/"+c.steps.length:(s.i+1)+"/"+c.steps.length+"단계 진행 중");
    h+='<button class="card" data-case="'+esc(c.id)+'" style="'+(c.tag==="적신호"?"border-color:#b4233c":"")+'"><b>'+esc(c.title)+'</b><span>'+esc(c.patient["나이·성별"]||"")+' · '+esc(c.tag)+' · '+esc(c.level)+' · '+c.steps.length+'단계</span><span class="tag'+(s&&s.done?" green":"")+'" style="align-self:flex-start">'+esc(status)+'</span></button>'; });
  h+='</div><p class="small muted" style="margin-top:16px">증례는 강의 내용(3장 알고리즘·적신호, 4~8장 중재, 8장 사례)에 맞춰 만든 교육용 시나리오입니다. 실제 환자 판단은 병력·검사 전체로 합니다.</p></div>';
  el.innerHTML=h; }
function drawCase(){ var c=D.cases.filter(function(x){ return x.id===curId; })[0], s=st(c.id);
  var h='<div class="wrap"><div class="pg-head"><div><h1 style="font-size:1.3rem">🩺 '+esc(c.title)+'</h1><p class="small muted" style="margin:2px 0 0">'+esc(c.tag)+' · '+esc(c.level)+' · 관련 장 '+c.chapters.map(function(n){ return n+"장"; }).join("·")+'</p></div><div class="row"><button class="btn sm" data-back="1">← 증례 목록</button><button class="btn sm danger" data-restart="1">처음부터</button></div></div>';
  h+='<div class="panel"><div class="vit">'+Object.keys(c.patient).map(function(k){ return '<div><span class="small muted">'+esc(k)+'</span><br>'+esc(c.patient[k])+'</div>'; }).join("")+'</div></div>';
  c.steps.forEach(function(stp,si){ if(si>s.i) return; var passed=si<s.i||s.done;
    h+='<div class="case-step'+(passed?" done":"")+'"><div class="small muted">'+(si+1)+' / '+c.steps.length+'단계'+(passed?(s.first[si]?' · <span style="color:#1f8a4c">첫 시도 정답</span>':' · 다시 골라 맞힘'):'')+'</div><p class="qstem">'+esc(stp.q)+(stp.kind==="multi"?' <span class="tag">모두 고르기</span>':'')+'</p>';
    var ord=ordOf(c.id,si,stp.opts.length);
    if(passed){ h+='<div class="opts">'+ord.filter(function(oi){ return stp.opts[oi].ok; }).map(function(oi){ return '<div class="opt right" style="cursor:default"><span class="n">✓</span><span>'+esc(stp.opts[oi].t)+'<small>'+esc(stp.opts[oi].fb||"")+'</small></span></div>'; }).join("")+'</div>';
      if(stp.reveal) h+='<div class="fb ok" style="background:none"><b>새로 알게 된 것</b> '+esc(stp.reveal)+'</div>';
      h+='<div class="row" style="margin-top:6px">'+linkBtn(stp.link)+'</div>'; }
    else { h+='<div class="opts">'+ord.map(function(oi,k){ var o=stp.opts[oi], on=pick.indexOf(oi)>=0, bad=wrongTry&&wrongTry.indexOf(oi)>=0&&!o.ok&&on;
        return '<button type="button" class="opt'+(bad?" wrong":"")+'" data-o="'+oi+'" aria-pressed="'+on+'"><span class="n">'+(stp.kind==="multi"?(on?"☑":"☐"):["①","②","③","④","⑤","⑥"][k])+'</span><span>'+esc(o.t)+(bad?'<small>'+esc(o.fb||"")+'</small>':'')+'</span></button>'; }).join("")+'</div>';
      if(wrongTry) h+='<div class="fb no">'+esc(wrongMsg(stp))+'</div>';
      h+='<div class="qnav"><button class="btn primary" id="csOk"'+(pick.length?"":" disabled")+'>확인</button>'+(wrongTry?'<button class="btn" id="csShow">정답 보기</button>':'')+'</div>'; }
    h+='</div>'; });
  if(s.done){ h+='<div class="panel ok"><h2 style="margin:0 0 6px">증례 완료 · 첫 시도 정답 '+s.score+' / '+c.steps.length+'</h2><b>핵심 정리</b><ul style="margin:6px 0 0;padding-left:20px;line-height:1.7">'+c.points.map(function(p){ return '<li>'+esc(p)+'</li>'; }).join("")+'</ul><div class="qnav"><button class="btn" data-back="1">다른 증례</button><button class="btn" data-restart="1">다시 풀기</button><button class="btn" data-go="review" data-arg="mock">국시 모의고사</button></div></div>'; }
  h+='</div>'; el.innerHTML=h;
  var ok=el.querySelector("#csOk"); if(ok){ ok.onclick=function(){ check(c,s); }; }
  var sh=el.querySelector("#csShow"); if(sh) sh.onclick=function(){ pass(c,s,false); };
  var steps=el.querySelectorAll(".case-step"); if(steps.length&&!s.done){ var last=steps[steps.length-1]; if(curId===drawCase.last&&s.i!==drawCase.lastI) last.scrollIntoView({behavior:"smooth",block:"start"}); }
  drawCase.last=curId; drawCase.lastI=s.i; }
function wrongMsg(stp){ if(stp.kind!=="multi") return "다시 생각해 보세요. 고른 답의 설명을 읽고 다른 답을 고르세요.";
  var need=stp.opts.filter(function(o){ return o.ok; }).length, got=pick.filter(function(i){ return stp.opts[i].ok; }).length, extra=pick.filter(function(i){ return !stp.opts[i].ok; }).length;
  return "해당하는 것 "+need+"개 중 "+got+"개를 골랐고, 해당하지 않는 것 "+extra+"개를 골랐습니다. 빨간 칸의 설명을 보고 다시 고르세요."; }
function check(c,s){ var stp=c.steps[s.i], right;
  if(stp.kind==="multi"){ var need=stp.opts.map(function(o,i){ return o.ok?i:-1; }).filter(function(i){ return i>=0; }); right=need.length===pick.length&&need.every(function(i){ return pick.indexOf(i)>=0; }); }
  else right=stp.opts[pick[0]]&&stp.opts[pick[0]].ok;
  (s.picks[s.i]=s.picks[s.i]||[]).push(pick.slice());
  if(right){ pass(c,s,!wrongTry); MP.say&&MP.say("정답입니다"); }
  else { wrongTry=pick.slice(); if(s.first[s.i]==null) s.first[s.i]=0; save(); drawCase(); MP.say&&MP.say("다시 생각해 보세요"); } }
function pass(c,s,firstOk){ if(s.first[s.i]==null) s.first[s.i]=firstOk?1:0; pick=[]; wrongTry=null; s.i++;
  if(s.i>=c.steps.length){ s.i=c.steps.length-1; s.done=true; s.at=Date.now(); s.score=Object.keys(s.first).filter(function(k){ return s.first[k]; }).length; }
  save(); drawCase(); }
el.addEventListener("click",function(e){ var t;
  if((t=e.target.closest("[data-case]"))){ curId=t.getAttribute("data-case"); pick=[]; wrongTry=null; drawCase(); el.scrollTop=0; return; }
  if(e.target.closest("[data-back]")){ curId=null; pick=[]; wrongTry=null; drawList(); el.scrollTop=0; return; }
  if(e.target.closest("[data-restart]")){ delete S.c[curId]; Object.keys(order).forEach(function(k){ if(k.indexOf(curId+":")===0) delete order[k]; }); pick=[]; wrongTry=null; save(); drawCase(); el.scrollTop=0; return; }
  if((t=e.target.closest("[data-go]"))){ MP.show(t.getAttribute("data-go"),t.getAttribute("data-arg")||(+t.getAttribute("data-slide")||0)); return; }
  if((t=e.target.closest(".case-step:not(.done) .opt[data-o]"))){ var c=D.cases.filter(function(x){ return x.id===curId; })[0], stp=c.steps[st(curId).i], oi=+t.getAttribute("data-o");
    if(stp.kind==="multi"){ var k=pick.indexOf(oi); if(k>=0) pick.splice(k,1); else pick.push(oi); } else pick=[oi];
    wrongTry=wrongTry&&stp.kind==="multi"?wrongTry:null; drawCase(); } });
})();
