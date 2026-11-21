
(function(){
"use strict";
var MOD=document.documentElement.getAttribute("data-mod")||"x";
var COLORS={ink:"#172033",red:"#d62839",blue:"#1f5fa8",green:"#1f8a4c",hl:"rgba(255,214,0,.42)"};
var slides=[].slice.call(document.querySelectorAll("section.slide[data-title]"));
var paged=slides.length>0;
var data={};          // key -> {i,t,memo,star,strokes:[{c,w,p:[x,y,...]}],ts}
var useParent=(window.parent&&window.parent!==window);
var LSK="mp-notes-v1:"+MOD;
var tool="pen", color="ink", penOn=false, hist=[];
var SHAPES={line:"➖ 직선",arrow:"↗ 화살표",rect:"▭ 네모",ellipse:"◯ 동그라미"}, shape="arrow";
function now(){return Date.now();}
/* ---------- storage ---------- */
function loadLocal(){try{var s=localStorage.getItem(LSK); if(s) data=JSON.parse(s)||{};}catch(e){}}
var saveT=0;
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(function(){
    Object.keys(data).forEach(function(k){var d=data[k]; if(!d.memo&&!d.star&&!(d.strokes&&d.strokes.length)) delete data[k];});
    if(useParent){ try{parent.postMessage({app:"mp",notesPut:MOD,notes:data},"*");}catch(e){} }
    else { try{localStorage.setItem(LSK,JSON.stringify(data));}catch(e){} }
    flash();
  },350);
}
/* ---------- slide helpers ---------- */
function curIdx(){ if(!paged) return 0; for(var i=0;i<slides.length;i++) if(slides[i].classList.contains("on")) return i; return 0; }
function keyOf(i){ return paged? slides[i].getAttribute("data-title") : "page"; }
function titleOf(i){ return paged? slides[i].getAttribute("data-title") : (document.title||"메모"); }
function entry(i,create){ var k=keyOf(i); if(!data[k]&&create) data[k]={i:i,t:titleOf(i),memo:"",star:false,strokes:[]}; if(data[k]){data[k].i=i;data[k].t=titleOf(i);} return data[k]; }
/* ---------- UI: button ---------- */
var btn=document.createElement("button"); btn.id="stBtn"; btn.type="button"; btn.setAttribute("aria-pressed","false");
btn.textContent="✍ 내 필기"; btn.title="이 슬라이드에 펜으로 쓰거나 메모를 남깁니다(브라우저에 저장)";
var bar=document.querySelector("header.bar");
var anchor=bar&&(bar.querySelector("#srchBtn")||bar.querySelector("#toc"));
if(bar){ if(anchor&&anchor.nextSibling) bar.insertBefore(btn,anchor.nextSibling); else bar.appendChild(btn); }
else { btn.classList.add("float"); document.body.appendChild(btn); }
/* ---------- toolbar ---------- */
var tb=document.createElement("div"); tb.id="stBar"; tb.hidden=true; tb.setAttribute("role","toolbar"); tb.setAttribute("aria-label","필기 도구");
function b(html,attrs){var e=document.createElement("button"); e.type="button"; e.innerHTML=html; for(var k in attrs) e.setAttribute(k,attrs[k]); tb.appendChild(e); return e;}
function sep(){var s=document.createElement("span"); s.className="sep"; tb.appendChild(s);}
var tPen,tHl,tEr,tSh,tTx,bFs,tNone,sws={},bUndo,bClear,bMemo,bHide,msg;
if(paged){
  tNone=b("👆 넘기기",{"data-t":"none",title:"필기 멈추고 슬라이드 조작(퀴즈 풀기 등)"});
  tPen=b("✏️ 펜",{"data-t":"pen",title:"펜 (P)"});
  tHl=b("🖍 형광펜",{"data-t":"hl",title:"형광펜 (H)"});
  tSh=b("↗ 도형 ▾",{"data-t":"shape",title:"직선·화살표·네모·동그라미 (S) — Shift를 누르고 그리면 반듯하게"});
  tTx=b("🔤 글자",{"data-t":"text",title:"쓰고 싶은 자리를 누른 뒤 자판으로 입력 (T) — Enter 완료 · Shift+Enter 줄바꿈 · Esc 취소. 써 둔 글자를 누르면 다시 고칩니다"});
  bFs=b("가 보통",{title:"글자 크기 바꾸기 (작게·보통·크게)"});
  tEr=b("🧽 지우개",{"data-t":"er",title:"지운 획을 누르거나 문지르기 (E)"});
  sep();
  ["ink","red","blue","green"].forEach(function(c){ var e=b("",{"class":"sw","data-c":c,"aria-label":{ink:"검정",red:"빨강",blue:"파랑",green:"초록"}[c]}); e.style.background=COLORS[c]; sws[c]=e; });
  sep();
  bUndo=b("↶ 되돌리기",{title:"마지막 필기 되돌리기 (Ctrl+Z)"});
  bClear=b("🗑 이 쪽 지우기",{title:"이 슬라이드의 펜 필기를 모두 지웁니다(메모는 남음)"});
  bHide=b("👁 숨기기",{"aria-pressed":"false",title:"필기를 잠깐 숨깁니다"});
  sep();
}
bMemo=b("📝 메모",{"aria-pressed":"false",title:"이 슬라이드 메모·중요 표시"});
msg=document.createElement("span"); msg.className="stmsg"; tb.appendChild(msg);
b("닫기 ✕",{title:"필기 도구 닫기"}).onclick=function(){setOpen(false);};
document.body.appendChild(tb);
var shp=document.createElement("div"); shp.id="stShp"; shp.hidden=true; shp.setAttribute("role","group"); shp.setAttribute("aria-label","도형 고르기");
Object.keys(SHAPES).forEach(function(k){ var e=document.createElement("button"); e.type="button"; e.textContent=SHAPES[k]; e.setAttribute("data-k",k); e.onclick=function(){ shape=k; if(tSh) tSh.textContent=SHAPES[k].split(" ")[0]+" 도형 ▾"; setTool("shape"); shp.hidden=true; syncShp(); }; shp.appendChild(e); });
var shpTip=document.createElement("small"); shpTip.textContent="Shift: 반듯하게"; shp.appendChild(shpTip);
document.body.appendChild(shp);
function syncShp(){ [].forEach.call(shp.querySelectorAll("button"),function(x){ x.setAttribute("aria-pressed",x.getAttribute("data-k")===shape); }); }
function openShp(){ if(!tSh) return; syncShp(); shp.hidden=false; var r=tSh.getBoundingClientRect(), w=shp.offsetWidth; shp.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px"; shp.style.top=(r.top-shp.offsetHeight-8)+"px"; }
/* ---------- memo panel ---------- */
var pn=document.createElement("aside"); pn.id="stPanel"; pn.hidden=true; pn.setAttribute("aria-label","슬라이드 메모");
pn.innerHTML='<header><b id="stTitle"></b><button class="x" type="button" aria-label="메모 닫기">✕</button></header><div class="body"><div class="row"><button class="star" type="button" aria-pressed="false">☆ 중요</button><span class="saved" id="stSaved"></span></div><textarea id="stTa" placeholder="이 슬라이드에서 기억할 점, 질문, 시험에 나올 것 같은 내용을 적어 두세요. 자동으로 저장됩니다."></textarea><div class="lst"><h4>이 장에서 남긴 노트</h4><div id="stList"></div></div></div>';
document.body.appendChild(pn);
var ta=pn.querySelector("#stTa"), starB=pn.querySelector(".star"), savedEl=pn.querySelector("#stSaved");
pn.querySelector(".x").onclick=function(){showMemo(false);};
function flash(){ if(window.__srSay) window.__srSay("메모 저장됨"); savedEl.textContent="저장됨 ✓"; clearTimeout(flash.t); flash.t=setTimeout(function(){savedEl.textContent="";},1400); }
ta.addEventListener("input",function(){ var e=entry(curIdx(),true); e.memo=ta.value; e.ts=now(); save(); renderList(); markStar(); });
ta.addEventListener("keydown",function(e){ e.stopPropagation(); });
starB.onclick=function(){ var e=entry(curIdx(),true); e.star=!e.star; e.ts=now(); save(); syncPanel(); renderList(); markStar(); };
function syncPanel(){
  var i=curIdx(), e=entry(i,false);
  pn.querySelector("#stTitle").textContent=(paged?(i+1)+". ":"")+titleOf(i);
  if(document.activeElement!==ta) ta.value=e?e.memo||"":"";
  var st=!!(e&&e.star); starB.setAttribute("aria-pressed",st); starB.textContent=st?"★ 중요":"☆ 중요";
}
function renderList(){
  var host=pn.querySelector("#stList"); var ks=Object.keys(data).filter(function(k){var d=data[k];return d.memo||d.star||(d.strokes&&d.strokes.length);});
  ks.sort(function(a,b){return (data[a].i||0)-(data[b].i||0);});
  if(!ks.length){ host.innerHTML='<p class="empty">아직 없습니다. 펜으로 쓰거나 메모를 남기면 여기에 모입니다.</p>'; return; }
  var ci=curIdx(); host.innerHTML="";
  ks.forEach(function(k){ var d=data[k]; var x=document.createElement("button"); x.type="button"; if(d.i===ci) x.className="cur";
    var bits=[]; if(d.star) bits.push("★"); if(d.strokes&&d.strokes.length) bits.push("✏️"+d.strokes.length);
    x.innerHTML=(paged?(d.i+1)+". ":"")+esc(d.t)+" <small>"+bits.join(" ")+"</small>"+(d.memo?'<br><small>'+esc(d.memo.slice(0,60))+(d.memo.length>60?"…":"")+'</small>':"");
    x.onclick=function(){ goTo(d.i); }; host.appendChild(x); });
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function goTo(i){ if(!paged) return; var t=document.getElementById("toc"); if(t){ t.value=String(i); t.dispatchEvent(new Event("change")); } }
function markStar(){ if(!paged) return; slides.forEach(function(s,i){ var m=s.querySelector(":scope > .st-mark"); var e=data[keyOf(i)]; var on=!!(e&&e.star);
  if(on&&!m){ m=document.createElement("span"); m.className="st-mark"; m.textContent="★ 중요"; s.appendChild(m); } else if(!on&&m) m.remove(); }); }

/* ---------- shapes ---------- */
function headPts(x0,y0,x1,y1,w){ var a=Math.atan2(y1-y0,x1-x0), L=12+w*3, s=0.5; return [x1-L*Math.cos(a-s),y1-L*Math.sin(a-s),x1-L*Math.cos(a+s),y1-L*Math.sin(a+s)]; }
function shapePath(g,st,k){ var p=st.p, x0=p[0]*k,y0=p[1]*k,x1=p[2]*k,y1=p[3]*k;
  if(st.k==="rect"){ g.rect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0)); }
  else if(st.k==="ellipse"){ g.ellipse((x0+x1)/2,(y0+y1)/2,Math.abs(x1-x0)/2,Math.abs(y1-y0)/2,0,0,Math.PI*2); }
  else { g.moveTo(x0,y0); g.lineTo(x1,y1); if(st.k==="arrow"){ var h=headPts(x0,y0,x1,y1,st.w*k); g.moveTo(h[0],h[1]); g.lineTo(x1,y1); g.lineTo(h[2],h[3]); } } }
function shapeSamples(st){ var p=st.p,x0=p[0],y0=p[1],x1=p[2],y1=p[3],o=[],n=40,t;
  if(st.k==="rect"){ [[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]].forEach(function(e){ for(t=0;t<=10;t++) o.push(e[0]+(e[2]-e[0])*t/10,e[1]+(e[3]-e[1])*t/10); }); }
  else if(st.k==="ellipse"){ var cx=(x0+x1)/2,cy=(y0+y1)/2,rx=Math.abs(x1-x0)/2,ry=Math.abs(y1-y0)/2; for(t=0;t<=n;t++) o.push(cx+rx*Math.cos(t/n*Math.PI*2),cy+ry*Math.sin(t/n*Math.PI*2)); }
  else { for(t=0;t<=20;t++) o.push(x0+(x1-x0)*t/20,y0+(y1-y0)*t/20); }
  return o; }
function shapeSVG(st,col){ var p=st.p,x0=p[0],y0=p[1],x1=p[2],y1=p[3],a=' fill="none" stroke="'+col+'" stroke-width="'+st.w+'" stroke-linecap="round" stroke-linejoin="round"';
  if(st.k==="rect") return '<rect x="'+Math.min(x0,x1)+'" y="'+Math.min(y0,y1)+'" width="'+Math.abs(x1-x0)+'" height="'+Math.abs(y1-y0)+'"'+a+'/>';
  if(st.k==="ellipse") return '<ellipse cx="'+(x0+x1)/2+'" cy="'+(y0+y1)/2+'" rx="'+Math.abs(x1-x0)/2+'" ry="'+Math.abs(y1-y0)/2+'"'+a+'/>';
  var d='M'+x0+' '+y0+'L'+x1+' '+y1; if(st.k==="arrow"){ var h=headPts(x0,y0,x1,y1,st.w); d+='M'+h[0]+' '+h[1]+'L'+x1+' '+y1+'L'+h[2]+' '+h[3]; } return '<path d="'+d+'"'+a+'/>'; }
function constrain(st,shift){ if(!shift) return; var p=st.p,dx=p[2]-p[0],dy=p[3]-p[1];
  if(st.k==="rect"||st.k==="ellipse"){ var m=Math.max(Math.abs(dx),Math.abs(dy)); p[2]=p[0]+(dx<0?-m:m); p[3]=p[1]+(dy<0?-m:m); }
  else { var a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4), r=Math.hypot(dx,dy); p[2]=p[0]+r*Math.cos(a); p[3]=p[1]+r*Math.sin(a); } }
/* ---------- keyboard text (k:"text", p:[x,y], fs, tx) ---------- */
var FONT='"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif', FSZ=[["작게",18],["보통",24],["크게",34]], fsI=1, BBX=new WeakMap(), HID=new WeakSet(), tEdit=null;
var mctx=document.createElement("canvas").getContext("2d");
function txtLines(st){ return String(st.tx||"").split("\n"); }
function txtBox(st){ var c=BBX.get(st); if(c) return c; mctx.font="600 "+st.fs+"px "+FONT; var L=txtLines(st), w=0; L.forEach(function(l){ w=Math.max(w,mctx.measureText(l).width); });
  var b=[st.p[0],st.p[1],st.p[0]+Math.max(w,st.fs*.6),st.p[1]+L.length*st.fs*1.3]; BBX.set(st,b); return b; }
function textSVG(st,col){ var L=txtLines(st); return '<text x="'+st.p[0]+'" y="'+st.p[1]+'" font-size="'+st.fs+'" font-weight="600" fill="'+col+'" font-family="Pretendard,\'Apple SD Gothic Neo\',\'Noto Sans KR\',\'Malgun Gothic\',sans-serif">'+L.map(function(l,n){ return '<tspan x="'+st.p[0]+'" dy="'+(n?st.fs*1.3:st.fs)+'">'+esc(l||" ")+'</tspan>'; }).join("")+'</text>'; }
function textAt(i,p){ var e=data[keyOf(i)]; if(!e) return null; for(var j=e.strokes.length-1;j>=0;j--){ var st=e.strokes[j]; if(st.k!=="text") continue; var b=txtBox(st); if(p[0]>=b[0]-6&&p[0]<=b[2]+6&&p[1]>=b[1]-6&&p[1]<=b[3]+6) return st; } return null; }
function openText(i,p,st){
  closeText(true); var c=canvasFor(i); if(!c) return; var s=slides[i], k=c.getBoundingClientRect().width/1000;
  var ta2=document.createElement("textarea"); ta2.className="st-tx"; ta2.rows=1; ta2.spellcheck=false; ta2.setAttribute("aria-label","필기 글자 입력");
  var fs=st?st.fs:FSZ[fsI][1], col=st?st.c:color, x=st?st.p[0]:p[0], y=st?st.p[1]:p[1];
  ta2.value=st?st.tx:""; ta2.style.left=(x*k+c.offsetLeft)+"px"; ta2.style.top=(y*k+c.offsetTop)+"px"; ta2.style.font="600 "+(fs*k)+"px "+FONT; ta2.style.lineHeight="1.3"; ta2.style.color=COLORS[col]||COLORS.ink;
  ta2.placeholder="글자 입력 후 Enter";
  s.appendChild(ta2); tEdit={i:i,ta:ta2,st:st,old:st?st.tx:"",fs:fs,c:col,x:x,y:y};
  if(st){ HID.add(st); draw(i); }
  function fit(){ ta2.style.height="auto"; ta2.style.height=ta2.scrollHeight+"px"; ta2.style.width="1px"; ta2.style.width=Math.min(s.clientWidth-(x*k)-8,Math.max(80,ta2.scrollWidth+12))+"px"; }
  ta2.addEventListener("input",fit); fit();
  ta2.addEventListener("keydown",function(ev){ ev.stopPropagation(); if(ev.isComposing||ev.keyCode===229) return;
    if(ev.key==="Enter"&&!ev.shiftKey){ ev.preventDefault(); closeText(true); } else if(ev.key==="Escape"){ ev.preventDefault(); closeText(false); } });
  ta2.addEventListener("pointerdown",function(ev){ ev.stopPropagation(); });
  ta2.addEventListener("blur",function(){ setTimeout(function(){ if(tEdit&&tEdit.ta===ta2) closeText(true); },150); });
  setTimeout(function(){ ta2.focus(); },0);
}
function closeText(commit){
  if(!tEdit) return; var t=tEdit; tEdit=null; var v=commit?t.ta.value.replace(/\s+$/,""):t.old; t.ta.remove();
  var e=entry(t.i,true);
  if(t.st){ HID.delete(t.st); BBX.delete(t.st);
    if(!v){ var j=e.strokes.indexOf(t.st); if(j>=0){ e.strokes.splice(j,1); hist.push({i:t.i,type:"del",s:t.st,at:j}); } }
    else if(v!==t.old){ t.st.tx=v; hist.push({i:t.i,type:"edit",s:t.st,old:t.old}); } else { draw(t.i); return; }
  } else { if(!v){ return; } var ns={c:t.c,w:0,k:"text",fs:t.fs,p:[Math.round(t.x*10)/10,Math.round(t.y*10)/10],tx:v}; e.strokes.push(ns); hist.push({i:t.i,type:"add",s:ns}); }
  e.ts=now(); save(); draw(t.i); renderList(); status();
}
function drawVisible(){ if(!paged) return; slides.forEach(function(sl,i){ var r=sl.getBoundingClientRect(); if(r.height&&r.bottom>0&&r.top<innerHeight&&(data[keyOf(i)]||!tb.hidden)) sizeAndDraw(i); }); }
/* ---------- canvas ---------- */
var cvs={};
function canvasFor(i){
  if(!paged) return null;
  var s=slides[i]; var c=cvs[i];
  if(!c){ c=document.createElement("canvas"); c.className="stcv"; s.appendChild(c); cvs[i]=c; bindDraw(c,i); }
  return c;
}
function sizeAndDraw(i){
  var c=canvasFor(i); if(!c) return; var s=slides[i];
  var w=s.clientWidth, h=Math.max(s.scrollHeight,s.clientHeight), dpr=window.devicePixelRatio||1;
  if(!w) return;
  c.style.width=w+"px"; c.style.height=h+"px";
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  draw(i);
}
function draw(i,extra){
  var c=cvs[i]; if(!c) return; var g=c.getContext("2d"); var dpr=window.devicePixelRatio||1; var w=c.width/dpr;
  g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,c.width,c.height); var k=w/1000;
  var e=data[keyOf(i)]; var list=(e&&e.strokes)?e.strokes.slice():[]; if(extra) list.push(extra);
  list.forEach(function(st){ var p=st.p; if(!p||p.length<2) return;
    g.strokeStyle=COLORS[st.c]||COLORS.ink; g.lineWidth=st.w*k; g.lineCap="round"; g.lineJoin="round";
    if(st.k==="text"){ if(HID.has(st)) return; g.globalCompositeOperation="source-over"; g.fillStyle=COLORS[st.c]||COLORS.ink; g.font="600 "+(st.fs*k)+"px "+FONT; g.textBaseline="top"; txtLines(st).forEach(function(l,n){ g.fillText(l,p[0]*k,(p[1]+n*st.fs*1.3+st.fs*.08)*k); }); return; }
    if(st.k){ g.globalCompositeOperation="source-over"; g.beginPath(); shapePath(g,st,k); g.stroke(); return; }
    g.globalCompositeOperation=st.c==="hl"?"multiply":"source-over";
    g.beginPath(); g.moveTo(p[0]*k,p[1]*k);
    if(p.length===2) g.lineTo(p[0]*k+0.1,p[1]*k);
    for(var j=2;j<p.length;j+=2) g.lineTo(p[j]*k,p[j+1]*k);
    g.stroke(); });
  g.globalCompositeOperation="source-over";
}
function bindDraw(c,i){
  var cur=null, pid=null;
  function pt(ev){ var r=c.getBoundingClientRect(); var k=1000/r.width; return [Math.round((ev.clientX-r.left)*k*10)/10, Math.round((ev.clientY-r.top)*k*10)/10]; }
  c.addEventListener("pointerdown",function(ev){
    if(!penOn||tool==="none") return; ev.preventDefault();
    if(tool==="text"){ var tp=pt(ev); openText(i,tp,textAt(i,tp)); return; }
    pid=ev.pointerId; try{c.setPointerCapture(pid);}catch(e){}
    var p=pt(ev);
    if(tool==="er"){ cur={er:true}; eraseAt(i,p); return; }
    if(tool==="shape"){ cur={c:color,w:3,k:shape,p:[p[0],p[1],p[0],p[1]]}; draw(i,cur); return; }
    cur={c:tool==="hl"?"hl":color, w:tool==="hl"?18:(ev.pointerType==="pen"&&ev.pressure?2+ev.pressure*2.4:3), p:[p[0],p[1]]};
    draw(i,cur);
  });
  c.addEventListener("pointermove",function(ev){
    if(!cur||ev.pointerId!==pid) return; ev.preventDefault(); var p=pt(ev);
    if(cur.er){ eraseAt(i,p); return; }
    if(cur.k){ cur.p[2]=p[0]; cur.p[3]=p[1]; constrain(cur,ev.shiftKey); draw(i,cur); return; }
    var n=cur.p.length; var dx=p[0]-cur.p[n-2], dy=p[1]-cur.p[n-1]; if(dx*dx+dy*dy<2) return;
    cur.p.push(p[0],p[1]); draw(i,cur);
  });
  function end(ev){
    if(!cur||(ev&&ev.pointerId!==pid)) return;
    if(cur.k&&Math.hypot(cur.p[2]-cur.p[0],cur.p[3]-cur.p[1])<4){ cur=null; pid=null; draw(i); return; }
    if(cur.k) cur.p=cur.p.map(function(v){return Math.round(v*10)/10;});
    if(!cur.er){ var e=entry(i,true); e.strokes.push(cur); e.ts=now(); hist.push({i:i,type:"add",s:cur}); save(); }
    cur=null; pid=null; draw(i); renderList(); status();
  }
  c.addEventListener("pointerup",end); c.addEventListener("pointercancel",end); c.addEventListener("lostpointercapture",end);
}
function eraseAt(i,p){
  var e=data[keyOf(i)]; if(!e||!e.strokes.length) return; var r=14;
  for(var j=e.strokes.length-1;j>=0;j--){ if(e.strokes[j].k==="text"){ var tb2=txtBox(e.strokes[j]); if(p[0]>=tb2[0]-4&&p[0]<=tb2[2]+4&&p[1]>=tb2[1]-4&&p[1]<=tb2[3]+4){ var s0=e.strokes.splice(j,1)[0]; hist.push({i:i,type:"del",s:s0,at:j}); e.ts=now(); save(); draw(i); renderList(); status(); } continue; }
    var q=e.strokes[j].k?shapeSamples(e.strokes[j]):e.strokes[j].p, hit=false;
    for(var m=0;m<q.length;m+=2){ var dx=q[m]-p[0], dy=q[m+1]-p[1]; if(dx*dx+dy*dy<r*r){hit=true;break;} }
    if(hit){ var s=e.strokes.splice(j,1)[0]; hist.push({i:i,type:"del",s:s,at:j}); e.ts=now(); save(); draw(i); renderList(); status(); }
  }
}
function undo(){
  var h=hist.pop(); if(!h){ toastMsg("되돌릴 필기가 없습니다"); return; }
  var e=entry(h.i,true);
  if(h.type==="add"){ var k=e.strokes.indexOf(h.s); if(k>=0) e.strokes.splice(k,1); }
  else if(h.type==="del"){ e.strokes.splice(Math.min(h.at,e.strokes.length),0,h.s); }
  else if(h.type==="clear"){ e.strokes=h.list.slice(); }
  else if(h.type==="edit"){ h.s.tx=h.old; BBX.delete(h.s); }
  if(h.i!==curIdx()) goTo(h.i);
  save(); draw(h.i); renderList(); status();
}
function status(){ if(!msg) return; var e=data[keyOf(curIdx())]; var n=e&&e.strokes?e.strokes.length:0; msg.textContent=n?("이 쪽 필기 "+n+"획"):""; }
function toastMsg(t){ if(window.__srSay) window.__srSay(t); if(!msg) return; msg.textContent=t; clearTimeout(toastMsg.t); toastMsg.t=setTimeout(status,1600); }
/* ---------- tool state ---------- */
function setTool(t){
  tool=t; penOn=(t!=="none"); document.body.classList.toggle("st-pen",penOn); document.body.classList.toggle("st-er",t==="er");
  if(t!=="text") closeText(true); document.body.classList.toggle("st-txt",t==="text");
  [tNone,tPen,tHl,tSh,tTx,tEr].forEach(function(x){ if(x) x.setAttribute("aria-pressed", x.getAttribute("data-t")===t); });
  if(t!=="shape"&&typeof shp!=="undefined") shp.hidden=true;
}
function setColor(c){ color=c; Object.keys(sws).forEach(function(k){ sws[k].setAttribute("aria-pressed",k===c); }); if(tool!=="pen"&&tool!=="shape"&&tool!=="text") setTool("pen"); if(tEdit){ tEdit.c=c; tEdit.ta.style.color=COLORS[c]; if(tEdit.st) tEdit.st.c=c; } }
function setOpen(on){
  tb.hidden=!on; btn.setAttribute("aria-pressed",on); if(!on) shp.hidden=true;
  if(on){ if(paged){ setTool("pen"); setColor("ink"); sizeAndDraw(curIdx()); drawVisible(); } else showMemo(true); status(); }
  else { closeText(true); if(paged) setTool("none"); showMemo(false); }
}
function showMemo(on){ pn.hidden=!on; bMemo.setAttribute("aria-pressed",on); if(on){ syncPanel(); renderList(); } }
btn.onclick=function(){ setOpen(tb.hidden); };
bMemo.onclick=function(){ showMemo(pn.hidden); if(!pn.hidden) setTimeout(function(){ta.focus();},30); };
if(paged){
  [tNone,tPen,tHl,tTx,tEr].forEach(function(x){ x.onclick=function(){ setTool(x.getAttribute("data-t")); }; });
  bFs.addEventListener("mousedown",function(ev){ ev.preventDefault(); });
  bFs.onclick=function(){ fsI=(fsI+1)%FSZ.length; bFs.textContent="가 "+FSZ[fsI][0]; if(tEdit){ var c=cvs[tEdit.i], k=c?c.getBoundingClientRect().width/1000:1; tEdit.fs=FSZ[fsI][1]; if(tEdit.st){ tEdit.st.fs=tEdit.fs; BBX.delete(tEdit.st); } tEdit.ta.style.fontSize=(tEdit.fs*k)+"px"; tEdit.ta.dispatchEvent(new Event("input")); } else if(tool!=="text") setTool("text"); };
  tSh.onclick=function(){ if(tool==="shape"&&!shp.hidden){ shp.hidden=true; return; } setTool("shape"); openShp(); };
  Object.keys(sws).forEach(function(k){ sws[k].addEventListener("mousedown",function(ev){ if(tEdit) ev.preventDefault(); }); sws[k].onclick=function(){ setColor(k); if(tEdit) tEdit.ta.focus(); }; });
  bUndo.onclick=undo;
  var clrArm=0;
  bClear.onclick=function(){
    var i=curIdx(), e=data[keyOf(i)]; if(!e||!e.strokes.length){ toastMsg("지울 필기가 없습니다"); return; }
    if(!clrArm){ clrArm=1; bClear.textContent="한 번 더 누르면 지움"; setTimeout(function(){clrArm=0; bClear.textContent="🗑 이 쪽 지우기";},2500); return; }
    clrArm=0; bClear.textContent="🗑 이 쪽 지우기";
    hist.push({i:i,type:"clear",list:e.strokes.slice()}); e.strokes=[]; e.ts=now(); save(); draw(i); renderList(); status(); toastMsg("지웠습니다 — ↶ 되돌리기로 복구");
  };
  bHide.onclick=function(){ var on=document.body.classList.toggle("st-hide"); bHide.setAttribute("aria-pressed",on); bHide.textContent=on?"👁 보이기":"👁 숨기기"; };
}
document.addEventListener("keydown",function(e){
  if(tb.hidden) return; var t=e.target.tagName; if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT") return;
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==="z"||e.key==="Z")&&paged){ e.preventDefault(); undo(); return; }
  if(!paged||e.ctrlKey||e.metaKey||e.altKey) return;
  var k=e.key.toLowerCase(); if(k==="p") setTool("pen"); else if(k==="h") setTool("hl"); else if(k==="e") setTool("er"); else if(k==="s"){ setTool("shape"); openShp(); } else if(k==="t"){ e.preventDefault(); setTool("text"); } else if(k==="escape"){ if(!shp.hidden) shp.hidden=true; else setOpen(false); }
});
/* ---------- react to slide changes & resizes ---------- */
var lastIdx=-1;
function onSlide(){ var i=curIdx(); if(i===lastIdx) return; if(tEdit&&tEdit.i!==i&&document.activeElement!==tEdit.ta) closeText(true); lastIdx=i; if(paged){ if(data[keyOf(i)]||!tb.hidden) sizeAndDraw(i); } if(!pn.hidden){ syncPanel(); renderList(); } status(); }
if(paged){ var mo=new MutationObserver(onSlide); slides.forEach(function(s){ mo.observe(s,{attributes:true,attributeFilter:["class"]}); }); }
var rzT=0; window.addEventListener("resize",function(){ clearTimeout(rzT); rzT=setTimeout(function(){ if(paged) sizeAndDraw(curIdx()); },120); });
if(paged && window.ResizeObserver){ var ro=new ResizeObserver(function(){ clearTimeout(rzT); rzT=setTimeout(function(){ sizeAndDraw(curIdx()); },80); }); slides.forEach(function(s){ ro.observe(s); }); }
function refreshAll(){ markStar(); lastIdx=-1; onSlide(); if(paged){ Object.keys(cvs).forEach(function(k){ draw(+k); }); drawVisible(); } }
/* ---------- init ---------- */
window.addEventListener("message",function(ev){ if(ev.source!==window.parent&&ev.source!==window) return; var d=ev.data; if(!d||d.app!=="mp") return;
  if(d.notesFor===MOD){ data=d.notes||{}; refreshAll(); }
  if(d.studyOpen){ setOpen(true); if(d.studyMemo) showMemo(true); }
});
if(useParent){ try{ parent.postMessage({app:"mp",notesGet:MOD},"*"); }catch(e){} } else { loadLocal(); }
refreshAll();
function addMemo(t){ var e=entry(curIdx(),true); e.memo=(e.memo?e.memo+"\n":"")+t; e.ts=now(); save(); markStar(); if(!pn.hidden){ ta.value=e.memo; renderList(); } }
window.__study={addMemo:addMemo,data:function(){return data;},setTool:setTool,setOpen:setOpen,undo:undo,showMemo:showMemo};
})();
