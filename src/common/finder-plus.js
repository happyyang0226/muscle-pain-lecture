/* 4단계 · 통증 원인 근육 찾기 보강 (finder 모듈 전용)
   1) 🎯 역방향 퀴즈 — (가) 근육을 보고 연관통 부위를 인체도에 찍기 (나) 연관통 그림을 보고 근육 맞히기
   2) 근육 상세에 '이 근육이 나오는 강의안 슬라이드' 바로가기(과정 전체 색인에서 찾음)
   기록: localStorage "mp-fq-v1" = {ts, n, ok, items:{근육:[푼 수, 맞힌 수]}} */
(function(){
"use strict";
if(typeof M==="undefined"||typeof ANAT==="undefined") return;
var KEY="mp-fq-v1", inApp=(window.parent&&window.parent!==window);
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"null")||{ts:0,n:0,ok:0,items:{}}; }catch(e){ return {ts:0,n:0,ok:0,items:{}}; } }
var S=load(); function save(){ S.ts=Date.now(); try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function say(t){ if(window.__srSay) window.__srSay(t); }
var POOL=M.filter(function(m){ return m.figs.some(function(f){ return (f.ref||[]).length; }); });

/* ---------- 화면 틀: 머리글 아래 모드 전환 ---------- */
var css=document.createElement("style");
css.textContent=".fqmode{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 2px}.fqmode button{font:inherit;font-size:14px;border:1px solid var(--line,#d5dbe3);background:var(--paper,#fff);color:inherit;border-radius:999px;padding:6px 14px;cursor:pointer}.fqmode button[aria-pressed=true]{background:var(--ink,#172033);color:var(--paper,#fff);border-color:transparent}"+
"#fq{max-width:1100px;margin:0 auto;padding:6px 16px 40px}#fq[hidden]{display:none}.fqgrid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px}@media(max-width:760px){.fqgrid{grid-template-columns:1fr}}"+
".fqbox{background:var(--paper,#fff);border:1px solid var(--line,#d5dbe3);border-radius:14px;padding:14px 16px}.fqmaps{display:flex;gap:8px;justify-content:center}.fqmaps figure{margin:0;flex:1;max-width:260px;text-align:center}.fqmaps figcaption{font-size:12.5px;color:var(--muted,#5a6578)}.fqmaps svg{width:100%;height:auto;max-height:62vh;cursor:crosshair}"+
".fqopts{display:flex;flex-direction:column;gap:6px;margin-top:8px}.fqopts button{font:inherit;text-align:left;border:1px solid var(--line,#d5dbe3);border-radius:10px;padding:9px 12px;background:var(--paper,#fff);color:inherit;cursor:pointer}.fqopts button.right{border-color:#1f8a4c;background:#eef8f1}.fqopts button.wrong{border-color:#b4233c;background:#fdeef0}"+
".fqbtn{font:inherit;font-size:14px;border:1px solid var(--line,#d5dbe3);background:var(--paper,#fff);color:inherit;border-radius:9px;padding:7px 13px;cursor:pointer}.fqbtn.pri{background:var(--ink,#172033);color:var(--paper,#fff);border-color:transparent}.fqbtn[disabled]{opacity:.45}"+
".fqfb{margin-top:10px;border-radius:10px;padding:10px 12px;line-height:1.6;font-size:14px}.fqfb.ok{background:#eef8f1;border:1px solid #9fcfb1}.fqfb.no{background:#fdeef0;border:1px solid #e5b3bc}.fqstat{font-size:13px;color:var(--muted,#5a6578)}"+
".chs2{margin-top:6px;display:flex;flex-wrap:wrap;gap:5px;font-size:12.5px;align-items:center}.chs2 button{font:inherit;font-size:12.5px;border:1px solid var(--line,#d5dbe3);border-radius:999px;padding:3px 10px;background:var(--paper,#fff);color:inherit;cursor:pointer}"+
"@media (prefers-color-scheme:dark){.fqopts button.right,.fqfb.ok{background:#13261b}.fqopts button.wrong,.fqfb.no{background:#2c1418}}";
document.head.appendChild(css);
var header=document.querySelector("header"), main=document.querySelector("main");
var bar=document.createElement("div"); bar.className="fqmode"; bar.setAttribute("role","group"); bar.setAttribute("aria-label","모드");
bar.innerHTML='<button type="button" data-mode="find" aria-pressed="true">🔍 부위로 근육 찾기</button><button type="button" data-mode="quiz" aria-pressed="false">🎯 역방향 퀴즈</button>';
header.appendChild(bar);
var box=document.createElement("section"); box.id="fq"; box.hidden=true; main.parentNode.insertBefore(box,main.nextSibling);
bar.onclick=function(e){ var b=e.target.closest("[data-mode]"); if(!b) return; var q=b.getAttribute("data-mode")==="quiz";
  [].forEach.call(bar.children,function(x){ x.setAttribute("aria-pressed",x===b); }); main.style.display=q?"none":""; box.hidden=!q; window.scrollTo(0,0); if(q&&!cur) next(); say(q?"역방향 퀴즈":"부위로 근육 찾기"); };

/* ---------- 퀴즈 ---------- */
var type="tap", cur=null;
function pick(){ var last=cur&&cur.m; var c=POOL.filter(function(m){ return m!==last; });
  /* 덜 풀었거나 자주 틀린 근육을 더 자주 */
  var w=c.map(function(m){ var it=S.items[m.n]||[0,0]; return 1+2*(it[0]-it[1])+(it[0]?0:1.5); }), sum=w.reduce(function(a,b){ return a+b; },0), r=Math.random()*sum;
  for(var i=0;i<c.length;i++){ r-=w[i]; if(r<=0) return c[i]; } return c[c.length-1]; }
function next(){ cur={m:pick(),taps:[],done:false,ans:null,opts:null}; if(type==="name") cur.opts=options(cur.m); draw(); }
function options(m){ var same=POOL.filter(function(x){ return x!==m&&x.g===m.g; }), other=POOL.filter(function(x){ return x!==m&&x.g!==m.g; });
  function sh(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  var d=sh(same).slice(0,3); d=d.concat(sh(other).slice(0,4-d.length)); return sh(d.concat([m])); }
function views(m){ return m.figs.filter(function(f){ return (f.ref||[]).length; }); }
function spec(f,mode){ var s={view:f.view,viewBox:"30 0 240 605",scapula:false,dim:false,label:(f.view==="back"?"뒤":"앞")+"에서 본 인체도"};
  if(mode==="trp"){ s.hl=f.hl||[]; s.deep=f.deep||[]; s.marks=f.marks||[]; }
  else if(mode==="ref"){ s.ref=f.ref||[]; }
  else if(mode==="all"){ s.hl=f.hl||[]; s.deep=f.deep||[]; s.marks=f.marks||[]; s.ref=f.ref||[]; }
  return s; }
function hitZone(f,x,y){ /* 왼쪽 기준 좌표(mir)로 연관통 타원 안인지 */ var X=x>150?300-x:x, hit=-1;
  (f.ref||[]).forEach(function(r,i){ var dx=(X-r[0])/(r[2]+9), dy=(y-r[1])/(r[3]+9); if(Math.hypot(dx,dy)<1&&hit<0) hit=i; }); return hit; }
function stat(){ var p=S.n?Math.round(S.ok/S.n*100):0; return '<span class="fqstat">지금까지 '+S.n+'문제 · 정답률 '+p+'%</span>'; }
function draw(){ var m=cur.m, F=views(m), h='';
  h+='<div class="row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin:6px 0 10px"><div class="fqmode" style="margin:0"><button type="button" data-t="tap" aria-pressed="'+(type==="tap")+'">근육 → 연관통 부위 찍기</button><button type="button" data-t="name" aria-pressed="'+(type==="name")+'">연관통 → 근육 맞히기</button></div>'+stat()+'</div>';
  h+='<div class="fqgrid"><div class="fqbox"><div class="fqmaps">';
  F.forEach(function(f,fi){ var mode=cur.done?"all":(type==="tap"?"trp":"ref"); var svg=ANAT.body(spec(f,mode)), pins="";
    cur.taps.forEach(function(t,i){ if(t.fi!==fi) return; var col=cur.done?(t.hit>=0?"#1f8a4c":"#b4233c"):"#1f5fa8";
      pins+='<g><circle cx="'+t.x+'" cy="'+t.y+'" r="9" fill="'+col+'" stroke="#fff" stroke-width="2"/><text x="'+t.x+'" y="'+(t.y+4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">'+(i+1)+'</text></g>'; });
    svg=svg.replace(/<\/svg>\s*$/,pins+"</svg>");
    h+='<figure data-fi="'+fi+'">'+svg+'<figcaption>'+(f.view==="back"?"뒤":"앞")+'</figcaption></figure>'; });
  h+='</div></div><div class="fqbox">';
  if(type==="tap"){
    h+='<h2 style="margin:0 0 4px;font-size:1.15rem">'+esc(m.n)+' <small style="font-weight:400;color:var(--muted)">'+esc(m.e)+'</small></h2><p style="margin:0 0 6px"><b>통증유발점</b> '+esc(m.loc)+'</p>';
    if(!cur.done){ h+='<p>이 근육의 통증유발점(흰 점)이 활성화되면 <b>어디로 통증을 보낼까요?</b> 인체도에서 연관통 부위를 <b>1~4곳</b> 누르세요. 다시 누르면 지워집니다.</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="fqbtn pri" id="fqCheck"'+(cur.taps.length?"":" disabled")+'>채점</button><button type="button" class="fqbtn" id="fqClear">지우기</button><button type="button" class="fqbtn" id="fqSkip">다른 근육</button></div>'; }
  } else {
    h+='<h2 style="margin:0 0 6px;font-size:1.15rem">이 연관통 패턴(붉은 부위)을 만드는 근육은?</h2>';
    h+='<div class="fqopts">'+cur.opts.map(function(o,i){ var cls=cur.done?(o===m?" right":(o===cur.ans?" wrong":"")):""; return '<button type="button" data-o="'+i+'" class="'+cls+'"'+(cur.done?" disabled":"")+'>'+esc(o.n)+' <small style="color:var(--muted)">'+esc(o.e)+'</small></button>'; }).join("")+'</div>';
  }
  if(cur.done){ h+='<div class="fqfb '+(cur.ok?"ok":"no")+'"><b>'+(cur.ok?"잘했습니다.":"다시 확인해 보세요.")+'</b> '+(cur.msg||"")+'<br><b>'+esc(m.n)+'</b> · 연관통: '+esc(m.ref)+'<br><span style="font-size:13px">통증유발점: '+esc(m.loc)+'</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button type="button" class="fqbtn pri" id="fqNext">다음 문제 →</button><button type="button" class="fqbtn" id="fqShow">'+(cur.detail?"자세히 닫기":"이 근육 자세히 · 운동 · 강의안")+'</button></div>'; }
  if(cur.done&&cur.detail){ try{ h+='</div></div><div id="fqDetail" class="fqbox" style="margin-top:14px">'+detail(m)+'</div><div><div>'; }catch(e){} }
  h+='<p class="fqstat" style="margin-top:12px">연관통 지도는 Travell &amp; Simons 요약을 단순화한 교육용 그림입니다. 개인차가 큽니다.</p></div></div>';
  box.innerHTML=h; bind(F); }
function bind(F){
  [].forEach.call(box.querySelectorAll("[data-t]"),function(b){ b.onclick=function(){ type=b.getAttribute("data-t"); next(); }; });
  if(type==="tap"&&!cur.done) [].forEach.call(box.querySelectorAll(".fqmaps figure"),function(fig){ var svg=fig.querySelector("svg"), fi=+fig.getAttribute("data-fi");
    svg.addEventListener("click",function(e){ var pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; var q=pt.matrixTransform(svg.getScreenCTM().inverse());
      var near=-1; cur.taps.forEach(function(t,i){ if(t.fi===fi&&Math.hypot(t.x-q.x,t.y-q.y)<14) near=i; });
      if(near>=0) cur.taps.splice(near,1); else if(cur.taps.length<4) cur.taps.push({fi:fi,x:Math.round(q.x),y:Math.round(q.y)}); else say("최대 4곳까지 누를 수 있습니다");
      draw(); say(cur.taps.length+"곳 선택"); }); });
  var ck=box.querySelector("#fqCheck"); if(ck) ck.onclick=function(){ grade(F); };
  var cl=box.querySelector("#fqClear"); if(cl) cl.onclick=function(){ cur.taps=[]; draw(); };
  var sk=box.querySelector("#fqSkip"); if(sk) sk.onclick=next;
  [].forEach.call(box.querySelectorAll(".fqopts [data-o]"),function(b){ b.onclick=function(){ cur.ans=cur.opts[+b.getAttribute("data-o")]; cur.done=true; cur.ok=cur.ans===cur.m; cur.msg=cur.ok?"":"고른 것은 "+cur.ans.n+"입니다."; rec(); draw(); say(cur.ok?"정답":"오답, 정답은 "+cur.m.n); }; });
  var nx=box.querySelector("#fqNext"); if(nx){ nx.onclick=next; nx.focus(); }
  var sh=box.querySelector("#fqShow"); if(sh) sh.onclick=function(){ cur.detail=!cur.detail; draw(); enhance(); if(cur.detail){ var d=box.querySelector("#fqDetail"); if(d) d.scrollIntoView({behavior:"smooth",block:"start"}); } };
}
function grade(F){ var zones={}, total=0, miss=0;
  F.forEach(function(f,fi){ total+=(f.ref||[]).length; });
  cur.taps.forEach(function(t){ var f=F[t.fi]; t.hit=hitZone(f,t.x,t.y); if(t.hit>=0) zones[t.fi+":"+t.hit]=1; else miss++; });
  var cov=Object.keys(zones).length, need=Math.min(2,total);
  cur.ok=cov>=need&&miss<=1; cur.done=true;
  cur.msg="연관통 부위 "+total+"곳 중 "+cov+"곳을 찾았고, 벗어난 점 "+miss+"개"+(cur.ok?"":" — 붉은 부위가 실제 연관통입니다")+".";
  rec(); draw(); say(cur.msg); }
function rec(){ var it=S.items[cur.m.n]||[0,0]; it[0]++; if(cur.ok) it[1]++; S.items[cur.m.n]=it; S.n++; if(cur.ok) S.ok++; save(); }

/* ---------- 근육 상세 → 강의안 슬라이드 바로가기 ---------- */
var IDX=null, TITLES={1:"1장",2:"2장",3:"3장",4:"4장",5:"5장",6:"6장",7:"7장",8:"8장"};
if(inApp){ window.addEventListener("message",function(e){ if(e.source!==window.parent) return; var d=e.data; if(d&&d.app==="mp"&&d.courseIdx){ IDX=d.courseIdx; enhance(); } });
  try{ parent.postMessage({app:"mp",courseGet:1},"*"); }catch(e){} }
function terms(m){ var t=[m.n]; String(m.n).split(/[·\s]/).forEach(function(x){ if(x.length>=3&&t.indexOf(x)<0) t.push(x); });
  try{ if(typeof EX!=="undefined"&&EX[m.n]&&EX[m.n].q) t.push(EX[m.n].q); }catch(e){} return t; }
function enhance(){ if(!IDX) return; [].forEach.call(document.querySelectorAll("#out .detail .dh, #fq .detail .dh"),enhanceOne); }
function enhanceOne(dh){ if(!IDX||!dh||dh.querySelector(".chs2")) return;
  var name=(dh.querySelector("h3")||{}).textContent, m=M.filter(function(x){ return x.n===name; })[0]; if(!m) return;
  var T=terms(m), hits=IDX.filter(function(s){ return T.some(function(w){ return s.x.indexOf(w)>=0||s.t.indexOf(w)>=0; }); });
  hits.sort(function(a,b){ var at=T.some(function(w){ return a.t.indexOf(w)>=0; })?0:1, bt=T.some(function(w){ return b.t.indexOf(w)>=0; })?0:1; return at-bt||a.c-b.c||a.n-b.n; });
  var div=document.createElement("div"); div.className="chs2";
  div.innerHTML=hits.length?('📖 이 근육이 나오는 슬라이드 '+hits.length+'곳: '+hits.slice(0,8).map(function(s){ return '<button type="button" data-c="'+s.c+'" data-n="'+s.n+'">'+TITLES[s.c]+' '+s.n+'. '+esc(s.t)+'</button>'; }).join("")+(hits.length>8?' <span>…</span>':'')):'<span>📖 강의안 본문에서 이 근육 이름을 찾지 못했습니다.</span>';
  dh.appendChild(div);
  div.onclick=function(e){ var b=e.target.closest("button[data-c]"); if(!b) return; parent.postMessage({app:"mp",open:"ch"+b.getAttribute("data-c"),slide:+b.getAttribute("data-n")},"*"); }; }
var out=document.getElementById("out"); if(out&&window.MutationObserver) new MutationObserver(enhance).observe(out,{childList:true,subtree:true});
window.__fq={next:next,state:function(){ return S; },cur:function(){ return cur; },setType:function(t){ type=t; next(); }};
})();
