/* ===== 2단계: 📚 복습 — 오늘의 복습(간격 반복) · 오개념 노트(확신도 4분면) · 국시 모의고사 =====
   문제은행: d-qbank (각 장 퀴즈 180문항 + 종합 40문항. 종합 문항은 같은 장 문항(same)으로 합쳐 센다)
   기록: localStorage "mp-study-v1" = {v,ts,items:{문항id:{box,due,seen,right,wrong,hist:[[ts,맞음,확신도,출처]]}},mocks:[…]}
   확신도: 0 확신한다 · 1 애매하다 · 2 모르겠다 (각 장 퀴즈와 같은 값) */
(function(){
"use strict";
var esc=MP.esc, KEY="mp-study-v1", DAY=864e5, INT=[0,1,3,7,14,30], CONF=["확신한다","애매하다","모르겠다"], NUM=["①","②","③","④","⑤"];
var CAT={mis:"오개념",unl:"모름",uns:"운 좋게 맞힘",mas:"숙달"}, CATD={mis:"확신했는데 틀림 · 1순위 교정",unl:"틀렸고 확신도 없음 · 기본 다시 보기",uns:"맞혔지만 확신 없음 · 복습 필요",mas:"확신하고 맞힘"};
var SRC={quiz:"장 퀴즈",review:"복습",mock:"모의고사"};
var S=load(), BANK=null, view="today", sess=null, mock=null, misF="mis";
function load(){ try{ var o=JSON.parse(localStorage.getItem(KEY)||"null"); if(o&&o.items) return o; }catch(e){} return {v:1,ts:0,items:{},mocks:[]}; }
function save(){ S.ts=Date.now(); try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function today(){ var d=new Date(); return Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/DAY); }
function cat(ok,c){ if(!ok&&c===0) return "mis"; if(!ok) return "unl"; if(c!==0) return "uns"; return "mas"; }
function item(id){ return S.items[id]||(S.items[id]={box:0,due:today(),seen:0,right:0,wrong:0,hist:[]}); }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* 한 번 풀 때마다 기록하고 다음 복습 날짜를 정한다(라이트너 상자 0~5) */
function record(id,ok,conf,src,schedule){ var it=item(id); it.seen++; if(ok) it.right++; else it.wrong++;
  it.hist.push([Date.now(),ok?1:0,conf,src]); if(it.hist.length>12) it.hist.splice(0,it.hist.length-12);
  if(schedule!==false){ var c=cat(ok,conf);
    if(c==="mas"){ it.box=Math.min(5,it.box+1); it.due=today()+INT[it.box]; if(it.box>=5&&it.right>=3) it.done=1; }
    else if(c==="uns"){ it.box=Math.max(1,Math.min(it.box,2)); it.due=today()+1; it.done=0; }
    else { it.box=1; it.due=today()+1; it.done=0; } }
  save(); }
MP.study={ dueCount:function(){ var t=today(); return Object.keys(S.items).filter(function(k){ var it=S.items[k]; return !it.done&&it.seen>=0&&it.due<=t&&it.queued; }).length; },
  merge:function(b){ if(!b||!b.items) return; Object.keys(b.items).forEach(function(k){ var a=S.items[k], x=b.items[k]; var la=a&&a.hist.length?a.hist[a.hist.length-1][0]:0, lb=x.hist&&x.hist.length?x.hist[x.hist.length-1][0]:0; if(!a||lb>la) S.items[k]=x; });
    (b.mocks||[]).forEach(function(m){ if(!S.mocks.some(function(y){ return y.ts===m.ts; })) S.mocks.push(m); }); S.mocks.sort(function(a,b){ return a.ts-b.ts; }); save(); },
  record:record, state:function(){ return S; }, cat:cat };

/* ---- 문제은행 준비: 장 퀴즈 기록을 읽어 복습 목록을 채운다 ---- */
MP.qbankFilters=MP.qbankFilters||[];
MP.qbank=function(){ return MP.data("qbank").then(function(b){ return MP.qbankFilters.reduce(function(x,f){ return f(x)||x; },b); }); };
function prep(b){ var all=[], by={}, fin={};
  Object.keys(b.mods).forEach(function(m){ b.mods[m].q.forEach(function(q,i){ q.m=m; q.i=i; if(m==="final"){ fin[i]=q; return; } all.push(q); by[q.id]=q; }); });
  return {raw:b,all:all,by:by,fin:fin,areas:b.areas,types:b.types}; }
function quizStates(){ /* 각 장(과 종합) 퀴즈를 제출한 기록 → [{id,ok,conf,src}] */ var out=[];
  Object.keys(BANK.raw.mods).forEach(function(m){ var md=BANK.raw.mods[m], st=null; try{ st=JSON.parse(localStorage.getItem(md.key)||"null"); }catch(e){}
    if(!st||!st.done||!st.ans) return;
    Object.keys(st.ans).forEach(function(k){ var q=md.q[+k]; if(!q||st.conf[k]==null) return; var id=m==="final"?(q.same||q.id):q.id;
      out.push({id:id,ok:st.ans[k]===q.a,conf:+st.conf[k],src:m==="final"?"종합평가":MP.T[m].split(" ")[0]+" 퀴즈",pick:st.ans[k],m:m}); }); });
  return out; }
function sync(){ /* 장 퀴즈에서 틀리거나 확신 없던 문항을 복습 목록에 처음 한 번 넣는다 */ var t=today(), ch=0;
  quizStates().forEach(function(r){ var it=S.items[r.id]; var tag="q:"+r.src;
    if(it&&it.seeded&&it.seeded.indexOf(tag)>=0) return; it=item(r.id); it.seeded=(it.seeded||[]).concat(tag);
    var c=cat(r.ok,r.conf); if(c!=="mas"){ it.queued=1; if(!it.hist.length) { it.box=0; it.due=t; } } ch++; });
  if(ch) save(); }
function ready(){ if(BANK) return Promise.resolve(BANK); return MP.qbank().then(function(b){ BANK=prep(b); sync(); return BANK; }); }
MP.study.ready=ready; MP.study.reload=function(){ BANK=null; return ready(); };
setTimeout(function(){ ready().then(function(){ if(MP.cur()==="home") MP.onHome.forEach(function(f){ try{ f(); }catch(e){} }); }); },300);

/* 최신 상태(4분면): 복습·모의고사 기록이 있으면 가장 최근 것, 없으면 장 퀴즈 결과 */
function latest(){ var map={};
  quizStates().forEach(function(r){ map[r.id]={id:r.id,ok:r.ok,conf:r.conf,src:r.src,pick:r.pick,pm:r.m,ts:0}; });
  Object.keys(S.items).forEach(function(id){ var it=S.items[id], h=it.hist[it.hist.length-1]; if(h&&(!map[id]||h[0]>map[id].ts)) map[id]={id:id,ok:!!h[1],conf:h[2],src:SRC[h[3]]||h[3],pick:h[4],ts:h[0]}; });
  Object.keys(map).forEach(function(id){ map[id].cat=cat(map[id].ok,map[id].conf); });
  return map; }
MP.study.latest=function(){ return ready().then(latest); };

/* 관련 슬라이드 찾기: 학습목표(LO3 → 'LO3-1 …' 슬라이드) */
var CIDX=null; MP.data("course-index").then(function(x){ CIDX=x; });
function slideFor(q){ var c=+String(q.m).replace("ch",""); if(!CIDX||!c) return 0; var lo=String(q.lo);
  var hit=CIDX.filter(function(s){ return s.c===c&&(s.t.indexOf(lo+"-")===0||s.t.indexOf(lo+" ")===0||(!/^LO\d/.test(lo)&&s.t.indexOf(lo)>=0)); })[0]; return hit?hit.n:0; }
function slideBtn(q){ var n=slideFor(q); return '<button type="button" class="btn sm" data-open="'+q.m+'" data-slide="'+n+'">📖 '+esc(MP.T[q.m].split(" ")[0]+" "+(n?n+"번 슬라이드":"강의안")+" · "+q.lo)+'</button>'; }
function evLinks(q){ return (q.ev||[]).map(function(e){ return '<a href="'+esc(e[2])+'" target="_blank" rel="noopener" class="tag blue">'+esc(e[0]+" · "+e[1])+'</a>'; }).join(" ")+(q.v?' <a href="'+esc(q.v[1])+'" target="_blank" rel="noopener" class="tag red">▶ '+esc(q.v[0])+'</a>':""); }
function meta(q){ var A=BANK.areas[q.area]||{}; return '<div class="meta"><span class="tag">'+esc(MP.T[q.m].split(" ")[0])+' · '+esc(q.lo)+'</span><span class="tag">'+esc(BANK.types[q.t]||q.t)+'</span>'+(A.n?'<span class="tag green" title="국가시험 영역">국시 '+esc(A.s.replace("물리치료 ","")+" · "+A.n)+'</span>':'')+'</div>'; }

/* ================= 화면 ================= */
var el=MP.page("review","복습",function(root,arg){ if(arg&&typeof arg==="string") view=arg; draw(); });
function draw(){ el.innerHTML='<div class="wrap"><p class="muted">문제은행을 불러오는 중…</p></div>'; ready().then(function(){ var h='<div class="wrap"><div class="pg-head"><div><h1>📚 복습</h1><p class="lead">각 장 퀴즈에서 틀리거나 확신 없던 문항이 자동으로 모입니다. 오늘 할 몫만 풀면, 맞힐수록 다음 복습이 1→3→7→14→30일 뒤로 멀어집니다.</p></div></div>';
  h+='<div class="seg" role="tablist" aria-label="복습 메뉴">'+[["today","오늘의 복습"],["mis","오개념 노트"],["mock","국시 모의고사"],["code","결과 코드"]].map(function(x){ return '<button type="button" role="tab" data-view="'+x[0]+'" aria-pressed="'+(view===x[0])+'">'+x[1]+'</button>'; }).join("")+'</div><div id="rvBody" style="margin-top:14px"></div></div>';
  el.innerHTML=h; var b=el.querySelector("#rvBody");
  ({today:drawToday,mis:drawMis,mock:drawMock,code:function(x){ (MP.study.drawCode||function(y){ y.innerHTML='<p class="muted">준비 중</p>'; })(x,BANK); }})[view](b); }); }
el.addEventListener("click",function(e){ var v=e.target.closest("[data-view]"); if(v){ view=v.getAttribute("data-view"); sess=sess&&view==="today"?sess:null; draw(); MP.say&&MP.say(v.textContent); return; }
  var o=e.target.closest("[data-open]"); if(o){ MP.show(o.getAttribute("data-open"),+o.getAttribute("data-slide")||0); } });

/* ---------- 오늘의 복습 ---------- */
function dueList(){ var t=today(), L=latest(); return Object.keys(S.items).filter(function(id){ var it=S.items[id]; return BANK.by[id]&&it.queued&&!it.done&&it.due<=t; })
  .sort(function(a,b){ var ra={mis:0,unl:1,uns:2,mas:3}[(L[a]||{}).cat]||1, rb={mis:0,unl:1,uns:2,mas:3}[(L[b]||{}).cat]||1; return ra-rb||S.items[a].box-S.items[b].box; }); }
function drawToday(box){
  if(!sess){ var due=dueList(), q=Object.keys(S.items).filter(function(id){ return S.items[id].queued&&!S.items[id].done; }), t=today(), soon=q.filter(function(id){ return S.items[id].due>t; }).length, grad=Object.keys(S.items).filter(function(id){ return S.items[id].done; }).length;
    var done=quizStates().length;
    var h='<div class="kpis"><div class="kpi"><b>'+due.length+'</b><span>오늘 복습할 문항</span></div><div class="kpi"><b>'+soon+'</b><span>앞으로 복습 예정</span></div><div class="kpi"><b>'+grad+'</b><span>졸업(충분히 익힘)</span></div><div class="kpi"><b>'+done+'</b><span>장 퀴즈에서 푼 문항</span></div></div>';
    if(!done&&!q.length) h+='<div class="panel info">아직 복습할 문항이 없습니다. 각 장 끝의 <b>퀴즈</b>를 풀고 제출하면, 틀렸거나 확신 없던 문항이 여기로 모입니다. 바로 연습하고 싶다면 아래에서 <b>임의 문항 10개</b>로 시작하세요.</div>';
    else if(!due.length) h+='<div class="panel ok">오늘 몫을 모두 끝냈습니다 👏 '+(soon?'다음 복습은 '+nextDue()+'입니다.':'')+'</div>';
    h+='<div class="row" style="margin-top:8px">'+(due.length?'<button class="btn primary" id="rvStart">오늘 복습 시작 ('+Math.min(due.length,20)+'문항)</button>':'')+'<button class="btn" id="rvRand">임의 문항 10개 연습</button><label class="small muted" style="display:flex;gap:6px;align-items:center">장 고르기 <select id="rvCh" class="btn sm"><option value="">전체</option>'+Object.keys(BANK.raw.mods).filter(function(m){return m!=="final";}).map(function(m){ return '<option value="'+m+'">'+esc(MP.T[m])+'</option>'; }).join("")+'</select></label></div>';
    h+=upcoming();
    box.innerHTML=h;
    var s=box.querySelector("#rvStart"); if(s) s.onclick=function(){ startSess(due.slice(0,20),"review"); };
    box.querySelector("#rvRand").onclick=function(){ var ch=box.querySelector("#rvCh").value; startSess(shuffle(BANK.all.filter(function(q){ return !ch||q.m===ch; })).slice(0,10).map(function(q){ return q.id; }),"review"); };
    return; }
  drawCard(box); }
function nextDue(){ var t=today(), d=Math.min.apply(null,Object.keys(S.items).filter(function(id){ return S.items[id].queued&&!S.items[id].done&&S.items[id].due>t; }).map(function(id){ return S.items[id].due; }));
  var n=d-t; return n===1?"내일":n+"일 뒤"; }
function upcoming(){ var t=today(), cnt=[0,0,0,0,0,0,0]; Object.keys(S.items).forEach(function(id){ var it=S.items[id]; if(it.queued&&!it.done){ var d=Math.max(0,it.due-t); if(d<7) cnt[d]++; } });
  if(!cnt.some(Boolean)) return ""; var mx=Math.max.apply(null,cnt)||1, W=["오늘","내일","+2일","+3일","+4일","+5일","+6일"];
  return '<h3>앞으로 7일 복습 일정</h3><div class="panel" style="display:flex;gap:10px;align-items:flex-end;height:120px">'+cnt.map(function(c,i){ return '<div style="flex:1;text-align:center;font-size:12px"><div style="height:'+Math.round(c/mx*70)+'px;background:'+(i?"#9fcfb1":"#1f8a4c")+';border-radius:6px 6px 0 0;min-height:2px" title="'+c+'문항"></div><div>'+c+'</div><div class="muted">'+W[i]+'</div></div>'; }).join("")+'</div>'; }
function startSess(ids,src){ sess={ids:ids,i:0,src:src,res:[],pick:null,conf:null,shown:false,order:null}; drawCard(el.querySelector("#rvBody")); }
function drawCard(box){ var id=sess.ids[sess.i];
  if(id==null){ var ok=sess.res.filter(function(r){ return r.ok; }).length; box.innerHTML='<div class="panel ok"><h3 style="margin-top:0">복습 끝 · '+ok+' / '+sess.res.length+' 정답</h3><p>'+(sess.res.filter(function(r){ return r.cat==="mis"; }).length?'자신 있게 틀린 문항이 있습니다. <b>오개념 노트</b>에서 해설과 관련 슬라이드를 다시 보세요.':'잘했습니다. 맞힌 문항은 더 긴 간격 뒤에 다시 나옵니다.')+'</p><div class="row"><button class="btn" data-view="today">복습 처음으로</button><button class="btn" data-view="mis">오개념 노트</button></div></div>'; sess=null; MP.say&&MP.say("복습 끝, "+ok+"문항 정답"); return; }
  var q=BANK.by[id]; if(!sess.order) sess.order=shuffle([0,1,2,3,4]);
  var h='<div class="row small muted" style="justify-content:space-between"><span>'+(sess.i+1)+' / '+sess.ids.length+'</span><button class="btn sm" id="rvQuit">그만하기</button></div><div class="qcard">'+meta(q)+'<p class="qstem">'+esc(q.s)+'</p><div class="opts">';
  sess.order.forEach(function(oi,k){ var cls=""; if(sess.shown){ if(oi===q.a) cls=" right"; else if(oi===sess.pick) cls=" wrong"; }
    h+='<button type="button" class="opt'+cls+'" data-o="'+oi+'" aria-pressed="'+(sess.pick===oi)+'"'+(sess.shown?" disabled":"")+'><span class="n">'+NUM[k]+'</span><span>'+esc(q.o[oi])+(sess.shown&&(oi===q.a||oi===sess.pick)&&q.w&&q.w[oi]?'<small>'+esc(q.w[oi])+'</small>':'')+'</span></button>'; });
  h+='</div>';
  if(!sess.shown){ h+='<div class="conf"><span>확신도</span>'+CONF.map(function(c,k){ return '<button type="button" data-c="'+k+'" aria-pressed="'+(sess.conf===k)+'">'+c+'</button>'; }).join("")+'</div><div class="qnav"><button class="btn primary" id="rvCheck"'+(sess.pick==null||sess.conf==null?" disabled":"")+'>정답 확인</button></div>'; }
  else { var ok=sess.pick===q.a, c=cat(ok,sess.conf), it=S.items[id];
    h+='<div class="fb '+(ok?"ok":"no")+'"><b>'+(ok?"정답입니다.":"오답입니다.")+'</b> '+(c==="mis"?"<b>자신 있게 틀렸습니다 — 오개념일 수 있어요.</b> ":"")+esc(q.c||"")+'<div class="row" style="margin-top:8px">'+slideBtn(q)+' '+evLinks(q)+'</div><div class="small muted" style="margin-top:6px">다음 복습: '+(it.done?"졸업 🎓":(it.due-today()===1?"내일":(it.due-today())+"일 뒤"))+'</div></div><div class="qnav"><button class="btn primary" id="rvNext">'+(sess.i+1<sess.ids.length?"다음 문항 →":"결과 보기")+'</button></div>'; }
  box.innerHTML=h+'</div>';
  box.querySelector("#rvQuit").onclick=function(){ sess=null; draw(); };
  [].forEach.call(box.querySelectorAll(".opt[data-o]"),function(b){ b.onclick=function(){ if(sess.shown) return; sess.pick=+b.getAttribute("data-o"); drawCard(box); MP.say&&MP.say("보기를 골랐습니다. 확신도를 고르세요."); }; });
  [].forEach.call(box.querySelectorAll("[data-c]"),function(b){ b.onclick=function(){ sess.conf=+b.getAttribute("data-c"); drawCard(box); }; });
  var ck=box.querySelector("#rvCheck"); if(ck) ck.onclick=function(){ var ok=sess.pick===q.a; record(id,ok,sess.conf,sess.src); S.items[id].queued=1; var hh=S.items[id].hist; hh[hh.length-1][4]=sess.pick; save();
    sess.res.push({id:id,ok:ok,cat:cat(ok,sess.conf)}); sess.shown=true; drawCard(box); MP.say&&MP.say(ok?"정답입니다":"오답입니다. 정답은 "+q.o[q.a]); };
  var nx=box.querySelector("#rvNext"); if(nx){ nx.onclick=function(){ sess.i++; sess.pick=null; sess.conf=null; sess.shown=false; sess.order=null; drawCard(box); el.scrollTop=0; }; nx.focus(); } }

/* ---------- 오개념 노트 ---------- */
function drawMis(box){ var L=latest(), ids=Object.keys(L).filter(function(id){ return BANK.by[id]; }), cnt={mis:0,unl:0,uns:0,mas:0};
  ids.forEach(function(id){ cnt[L[id].cat]++; });
  var h='<p class="small muted" style="margin-top:0">문항마다 가장 최근에 푼 결과(장 퀴즈·복습·모의고사)로 나눕니다. <b>오개념</b>(확신했는데 틀림)은 그냥 모르는 것보다 고치기 어려워 가장 먼저 봐야 합니다.</p>';
  h+='<div class="quad" role="group" aria-label="4분면 고르기">'+["mis","unl","uns","mas"].map(function(k){ return '<button type="button" class="'+k+'" data-f="'+k+'" aria-pressed="'+(misF===k)+'"><b>'+cnt[k]+'</b>'+CAT[k]+'<br><span>'+CATD[k]+'</span></button>'; }).join("")+'</div>';
  if(!ids.length){ box.innerHTML=h+'<div class="panel info">아직 푼 기록이 없습니다. 각 장 퀴즈를 제출하거나 오늘의 복습·모의고사를 풀면 여기에 쌓입니다.</div>'; bindQuad(box); return; }
  var list=ids.filter(function(id){ return L[id].cat===misF; }).map(function(id){ return BANK.by[id]; }).sort(function(a,b){ return a.m<b.m?-1:a.m>b.m?1:a.i-b.i; });
  /* 영역별 오개념 */
  var byA={}; ids.forEach(function(id){ var a=BANK.by[id].area; byA[a]=byA[a]||{n:0,mis:0,wrong:0}; byA[a].n++; if(!L[id].ok) byA[a].wrong++; if(L[id].cat==="mis") byA[a].mis++; });
  h+='<details class="panel"><summary><b>국시 영역별로 보기</b></summary><div class="tbwrap" style="margin-top:8px"><table class="tb"><tr><th>영역</th><th class="num">푼 문항</th><th class="num">오답</th><th class="num">오개념</th></tr>'+Object.keys(byA).sort(aOrd).map(function(a){ var A=BANK.areas[a]||{n:a,s:""}; return '<tr><td>'+esc(A.s.replace("물리치료 ","")+" · "+A.n)+'</td><td class="num">'+byA[a].n+'</td><td class="num">'+byA[a].wrong+'</td><td class="num">'+byA[a].mis+'</td></tr>'; }).join("")+'</table></div></details>';
  h+='<div class="row noprint" style="justify-content:space-between;margin:10px 0"><b>'+CAT[misF]+' '+list.length+'문항</b><span class="row">'+(list.length&&misF!=="mas"?'<button class="btn sm green" id="msDrill">이 문항들만 복습</button>':'')+'<button class="btn sm" id="msPrint">인쇄 / PDF</button></span></div>';
  h+=list.map(function(q){ var r=L[q.id], pk=r.pick; var mine=(pk!=null&&r.pm&&r.pm!==q.m)?null:pk; /* 종합평가에서 고른 번호는 보기 순서가 달라 표시하지 않음 */
    return '<div class="qcard">'+meta(q)+'<p class="qstem">'+esc(q.s)+'</p>'+(mine!=null&&mine!==q.a?'<p style="margin:4px 0"><span class="tag red">내 답</span> '+esc(q.o[mine])+(q.w&&q.w[mine]?'<br><span class="small muted">→ '+esc(q.w[mine])+'</span>':'')+'</p>':'')+
      '<p style="margin:4px 0"><span class="tag green">정답</span> <b>'+esc(q.o[q.a])+'</b>'+(q.w&&q.w[q.a]?'<br><span class="small muted">→ '+esc(q.w[q.a])+'</span>':'')+'</p>'+(q.c?'<p class="small" style="margin:6px 0"><b>핵심</b> '+esc(q.c)+'</p>':'')+
      '<div class="row small muted">최근: '+esc(r.src)+' · 확신도 '+esc(CONF[r.conf]||"-")+'</div><div class="row" style="margin-top:6px">'+slideBtn(q)+' '+evLinks(q)+'</div></div>'; }).join("");
  box.innerHTML=h; bindQuad(box);
  var dr=box.querySelector("#msDrill"); if(dr) dr.onclick=function(){ view="today"; draw(); setTimeout(function(){ startSess(shuffle(list.map(function(q){ return q.id; })).slice(0,20),"review"); },30); };
  box.querySelector("#msPrint").onclick=function(){ window.print(); }; }
function bindQuad(box){ [].forEach.call(box.querySelectorAll(".quad [data-f]"),function(b){ b.onclick=function(){ misF=b.getAttribute("data-f"); drawMis(box); }; }); }

/* ---------- 국시 모의고사 ---------- */
function drawMock(box){ if(mock&&!mock.done){ drawMockQ(box); return; } if(mock&&mock.done){ drawMockRes(box); return; }
  var h='<div class="panel"><h3 style="margin-top:0">국시형 모의고사 만들기</h3><p class="small muted" style="margin-top:0">180문항 문제은행에서 국가시험 영역(물리치료 기초·진단평가·중재)이 고르게 섞이도록 뽑습니다. 풀 때는 정답을 보여 주지 않고, 제출하면 영역별 점수와 해설을 보여 줍니다.</p>';
  h+='<div class="row"><span class="small muted" style="width:70px">문항 수</span><div class="seg" id="mkN"><button type="button" data-n="20" aria-pressed="false">20</button><button type="button" data-n="40" aria-pressed="true">40</button><button type="button" data-n="60" aria-pressed="false">60</button></div></div>';
  h+='<div class="row" style="margin-top:8px"><span class="small muted" style="width:70px">시간</span><div class="seg" id="mkT"><button type="button" data-t="1" aria-pressed="true">문항당 1분</button><button type="button" data-t="0" aria-pressed="false">제한 없음</button></div></div>';
  h+='<div class="row" style="margin-top:8px"><span class="small muted" style="width:70px">범위</span>'+Object.keys(BANK.raw.mods).filter(function(m){return m!=="final";}).map(function(m){ return '<label class="small"><input type="checkbox" class="mkC" value="'+m+'" checked> '+esc(MP.T[m].split(" ")[0])+'</label>'; }).join(" ")+'</div>';
  h+='<div class="qnav"><button class="btn primary" id="mkGo">시작</button></div></div>';
  if(S.mocks.length){ h+='<h3>지난 모의고사</h3><div class="tbwrap"><table class="tb"><tr><th>날짜</th><th class="num">점수</th><th>영역별 정답률</th></tr>'+S.mocks.slice(-10).reverse().map(function(m){ return '<tr><td>'+new Date(m.ts).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})+'</td><td class="num">'+m.score+' / '+m.n+' ('+Math.round(m.score/m.n*100)+'%)</td><td class="small">'+Object.keys(m.byA||{}).sort(aOrd).map(function(a){ var A=BANK.areas[a]||{n:a}; return esc(A.n)+' '+Math.round(m.byA[a][0]/m.byA[a][1]*100)+'%'; }).join(" · ")+'</td></tr>'; }).join("")+'</table></div>'; }
  box.innerHTML=h;
  [["#mkN","data-n"],["#mkT","data-t"]].forEach(function(p){ var g=box.querySelector(p[0]); g.onclick=function(e){ var b=e.target.closest("button"); if(!b) return; [].forEach.call(g.children,function(x){ x.setAttribute("aria-pressed",x===b); }); }; });
  box.querySelector("#mkGo").onclick=function(){ var n=+box.querySelector('#mkN [aria-pressed=true]').getAttribute("data-n"), timed=box.querySelector('#mkT [aria-pressed=true]').getAttribute("data-t")==="1";
    var chs=[].map.call(box.querySelectorAll(".mkC:checked"),function(x){ return x.value; }); if(!chs.length){ alertBox(box,"범위를 하나 이상 고르세요."); return; }
    var ids=pickMock(n,chs); mock={ids:ids,ans:{},conf:{},i:0,start:Date.now(),limit:timed?ids.length*60:0,done:false,order:ids.map(function(){ return shuffle([0,1,2,3,4]); })};
    drawMockQ(box); tick(); }; }
function alertBox(box,t){ var p=document.createElement("div"); p.className="panel warn"; p.textContent=t; box.prepend(p); setTimeout(function(){ p.remove(); },2500); }
function pickMock(n,chs){ /* 영역별 문항 수 비율대로 층화 추출 */ var pool=BANK.all.filter(function(q){ return chs.indexOf(q.m)>=0; }), by={};
  pool.forEach(function(q){ (by[q.area]=by[q.area]||[]).push(q); }); n=Math.min(n,pool.length);
  var keys=Object.keys(by), quota={}, got=0; keys.forEach(function(a){ quota[a]=Math.floor(by[a].length/pool.length*n); got+=quota[a]; });
  keys.sort(function(a,b){ return (by[b].length/pool.length*n-quota[b])-(by[a].length/pool.length*n-quota[a]); }); for(var i=0;got<n;i=(i+1)%keys.length){ if(quota[keys[i]]<by[keys[i]].length){ quota[keys[i]]++; got++; } }
  var out=[]; keys.forEach(function(a){ out=out.concat(shuffle(by[a]).slice(0,quota[a])); });
  var ord={"B":0,"D":1,"I":2}; return shuffle(out).sort(function(a,b){ return ord[a.area[0]]-ord[b.area[0]]; }).map(function(q){ return q.id; }); }
var tmr=0; function tick(){ clearInterval(tmr); tmr=setInterval(function(){ if(!mock||mock.done){ clearInterval(tmr); return; } var t=el.querySelector("#mkTime"); var left=mock.limit?mock.limit-Math.floor((Date.now()-mock.start)/1000):null;
  if(t) t.textContent=left!=null?fmt(Math.max(0,left))+" 남음":fmt(Math.floor((Date.now()-mock.start)/1000))+" 지남";
  if(left!=null&&left<=0){ finishMock(); } },1000); }
function fmt(s){ var m=Math.floor(s/60), x=s%60; return m+":"+(x<10?"0":"")+x; }
function drawMockQ(box){ var k=mock.i, id=mock.ids[k], q=BANK.by[id], ord=mock.order[k], A=BANK.areas[q.area]||{};
  var h='<div class="row" style="justify-content:space-between"><b>모의고사 '+(k+1)+' / '+mock.ids.length+'</b><span class="timer" id="mkTime" aria-live="off"></span></div>';
  h+='<div class="dots" role="group" aria-label="문항 바로가기">'+mock.ids.map(function(_,j){ return '<button type="button" data-j="'+j+'" class="'+(mock.ans[j]!=null?"done ":"")+(j===k?"cur":"")+'" aria-label="문제 '+(j+1)+(mock.ans[j]!=null?" 답함":"")+'">'+(j+1)+'</button>'; }).join("")+'</div>';
  h+='<div class="qcard"><div class="meta"><span class="tag">'+esc(A.s||"")+'</span><span class="tag">'+esc(BANK.types[q.t]||"")+'</span></div><p class="qstem">'+esc(q.s)+'</p><div class="opts">'+ord.map(function(oi,j){ return '<button type="button" class="opt" data-o="'+oi+'" aria-pressed="'+(mock.ans[k]===oi)+'"><span class="n">'+NUM[j]+'</span><span>'+esc(q.o[oi])+'</span></button>'; }).join("")+'</div>';
  h+='<div class="conf"><span>확신도(선택)</span>'+CONF.map(function(c,j){ return '<button type="button" data-c="'+j+'" aria-pressed="'+(mock.conf[k]===j)+'">'+c+'</button>'; }).join("")+'</div>';
  var left=mock.ids.length-Object.keys(mock.ans).length;
  h+='<div class="qnav"><button class="btn" id="mkP"'+(k?"":" disabled")+'>← 이전</button><button class="btn primary" id="mkNx"'+(k+1<mock.ids.length?"":" disabled")+'>다음 →</button><button class="btn green" id="mkEnd">제출'+(left?" (안 푼 문항 "+left+"개)":"")+'</button><button class="btn danger sm" id="mkQuit">그만두기</button></div></div>';
  box.innerHTML=h;
  [].forEach.call(box.querySelectorAll(".opt"),function(b){ b.onclick=function(){ mock.ans[k]=+b.getAttribute("data-o"); drawMockQ(box); }; });
  [].forEach.call(box.querySelectorAll("[data-c]"),function(b){ b.onclick=function(){ mock.conf[k]=+b.getAttribute("data-c"); drawMockQ(box); }; });
  [].forEach.call(box.querySelectorAll("[data-j]"),function(b){ b.onclick=function(){ mock.i=+b.getAttribute("data-j"); drawMockQ(box); }; });
  box.querySelector("#mkP").onclick=function(){ mock.i--; drawMockQ(box); }; box.querySelector("#mkNx").onclick=function(){ mock.i++; drawMockQ(box); };
  var arm=0; box.querySelector("#mkEnd").onclick=function(){ var lf=mock.ids.length-Object.keys(mock.ans).length; if(lf&&!arm){ arm=1; this.textContent="안 푼 문항 "+lf+"개 · 정말 제출?"; return; } finishMock(); };
  box.querySelector("#mkQuit").onclick=function(){ mock=null; clearInterval(tmr); drawMock(box); }; }
function finishMock(){ if(!mock||mock.done) return; mock.done=true; mock.secs=Math.floor((Date.now()-mock.start)/1000); clearInterval(tmr);
  var score=0, byA={}, byC={}, byT={};
  mock.ids.forEach(function(id,k){ var q=BANK.by[id], ok=mock.ans[k]===q.a; if(ok) score++;
    [[byA,q.area],[byC,q.m],[byT,q.t]].forEach(function(p){ p[0][p[1]]=p[0][p[1]]||[0,0]; p[0][p[1]][1]++; if(ok) p[0][p[1]][0]++; });
    if(mock.ans[k]!=null){ var c=mock.conf[k]!=null?mock.conf[k]:1; record(id,ok,c,"mock",!ok||c!==0?true:false); var it=S.items[id]; if(!ok||c!==0) it.queued=1; it.hist[it.hist.length-1][4]=mock.ans[k]; } });
  S.mocks.push({ts:Date.now(),n:mock.ids.length,score:score,byA:byA,secs:mock.secs}); if(S.mocks.length>30) S.mocks.shift(); save();
  mock.score=score; mock.byA=byA; mock.byC=byC; mock.byT=byT; drawMockRes(el.querySelector("#rvBody")); el.scrollTop=0; MP.say&&MP.say("모의고사 제출. "+score+"점"); }
function aOrd(a,b){ var K=Object.keys(BANK.areas); return (K.indexOf(a)<0?99:K.indexOf(a))-(K.indexOf(b)<0?99:K.indexOf(b))||(a<b?-1:a>b?1:0); }
function rowsOf(o,lab){ return Object.keys(o).sort(aOrd).map(function(k){ var p=o[k][0]/o[k][1]; return '<tr><td>'+esc(lab(k))+'</td><td class="num">'+o[k][0]+' / '+o[k][1]+'</td><td style="width:40%"><div class="bar"><i style="width:'+Math.round(p*100)+'%;background:'+(p>=.6?"#1f8a4c":"#b4233c")+'"></i></div></td><td class="num">'+Math.round(p*100)+'%</td></tr>'; }).join(""); }
function drawMockRes(box){ var n=mock.ids.length, p=mock.score/n;
  var h='<div class="panel '+(p>=.6?"ok":"warn")+'"><h2 style="margin:0">'+mock.score+' / '+n+'점 · '+Math.round(p*100)+'%</h2><p style="margin:6px 0 0">'+(p>=.6?"국가시험 합격 기준(과목별 40% 이상, 전체 60% 이상)에 비추어 볼 때 이 범위는 안정권입니다.":"전체 60%에 못 미칩니다. 아래에서 정답률이 낮은 영역부터 다시 보세요.")+' 걸린 시간 '+fmt(mock.secs)+'.</p></div>';
  h+='<h3>국시 영역별</h3><div class="tbwrap"><table class="tb">'+rowsOf(mock.byA,function(a){ var A=BANK.areas[a]||{n:a,s:""}; return A.s.replace("물리치료 ","")+" · "+A.n; })+'</table></div>';
  h+='<details class="panel"><summary><b>장별 · 유형별</b></summary><div class="tbwrap" style="margin-top:8px"><table class="tb">'+rowsOf(mock.byC,function(m){ return MP.T[m]; })+rowsOf(mock.byT,function(t){ return BANK.types[t]||t; })+'</table></div></details>';
  var wrong=mock.ids.map(function(id,k){ return {q:BANK.by[id],k:k}; }).filter(function(x){ return mock.ans[x.k]!==x.q.a; });
  h+='<h3>틀리거나 안 푼 문항 '+wrong.length+'개</h3>'+wrong.map(function(x){ var q=x.q, a=mock.ans[x.k]; return '<div class="qcard">'+meta(q)+'<p class="qstem">'+esc(q.s)+'</p>'+(a!=null?'<p style="margin:4px 0"><span class="tag red">내 답</span> '+esc(q.o[a])+(q.w&&q.w[a]?'<br><span class="small muted">→ '+esc(q.w[a])+'</span>':'')+'</p>':'<p class="small muted">안 푼 문항</p>')+'<p style="margin:4px 0"><span class="tag green">정답</span> <b>'+esc(q.o[q.a])+'</b></p>'+(q.c?'<p class="small"><b>핵심</b> '+esc(q.c)+'</p>':'')+'<div class="row">'+slideBtn(q)+'</div></div>'; }).join("");
  h+='<div class="qnav"><button class="btn primary" id="mkAgain">새 모의고사</button><button class="btn" data-view="mis">오개념 노트</button><button class="btn" id="mkPrint">인쇄 / PDF</button></div>';
  box.innerHTML=h; box.querySelector("#mkAgain").onclick=function(){ mock=null; drawMock(box); }; box.querySelector("#mkPrint").onclick=function(){ window.print(); }; }
})();
