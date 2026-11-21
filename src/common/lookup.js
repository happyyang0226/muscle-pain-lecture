
(function(){
"use strict";
var G=[]; try{ G=JSON.parse(document.getElementById("lkData").textContent); }catch(e){}
var MOD=document.documentElement.getAttribute("data-mod")||"x";
var slides=[].slice.call(document.querySelectorAll("section.slide[data-title]"));
var inApp=(window.parent&&window.parent!==window);
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function norm(s){return String(s||"").toLowerCase().replace(/[\s·\-‐–—_()（）\[\]「」『』'"“”‘’.,!?:;…\/]/g,"");}
/* ---- word cleanup: strip Korean particles/endings ---- */
var JOSA=["으로부터","에서부터","이라는","이라고","입니다","이에요","이다","에서는","에게서","까지는","으로는","에서","에게","까지","부터","처럼","보다","으로","라는","이며","이고","하고","하는","하며","한다","된다","되는","은","는","이","가","을","를","의","에","로","와","과","도","만","나","란","며","고"];
function cands(q){ var s=String(q||"").trim().replace(/^[\s"'“‘(\[]+|[\s"'”’)\].,!?:;…]+$/g,""); var out=[s]; var t=s;
  for(var n=0;n<3;n++){ var hit=false; for(var i=0;i<JOSA.length;i++){ var j=JOSA[i]; if(t.length>j.length+1&&t.slice(-j.length)===j){ t=t.slice(0,-j.length); out.push(t); hit=true; break; } } if(!hit) break; }
  return out; }
/* ---- glossary index ---- */
var IDX=G.map(function(g,i){ var keys=[g.t,g.en].concat(g.a||[]).map(norm).filter(Boolean); return {i:i,keys:keys}; });
function lookup(q){
  var cs=cands(q).map(norm).filter(Boolean); if(!cs.length) return {best:null,sim:[]};
  var best=null, score=0, sim=[];
  IDX.forEach(function(x){ var s=0;
    cs.forEach(function(c,ci){ x.keys.forEach(function(k){ var v=0;
      if(k===c) v=100-ci; else if(c.length>=2&&k.indexOf(c)===0) v=60-ci; else if(c.length>=2&&k.indexOf(c)>0) v=40-ci; else if(k.length>=2&&c.indexOf(k)>=0) v=35+Math.min(k.length,10)-ci;
      if(v>s) s=v; }); });
    if(s>0) sim.push({i:x.i,s:s}); });
  sim.sort(function(a,b){return b.s-a.s;});
  if(sim.length&&sim[0].s>=35){ best=G[sim[0].i]; score=sim[0].s; sim=sim.slice(1); }
  return {best:best,score:score,sim:sim.slice(0,8).map(function(x){return G[x.i];})};
}
function termsFor(q,best){ var t=cands(q).filter(function(x){return x.length>=1;}).slice(-1); if(best){ t=t.concat([best.t]).concat((best.a||[]).filter(function(a){return /[가-힣]{2,}|^[A-Za-z]{2,}$/.test(a)&&a.indexOf("(")<0;})); } var seen={},o=[]; t.forEach(function(x){ var k=x.toLowerCase(); if(x&&!seen[k]){seen[k]=1;o.push(x);} }); return o; }
/* ---- slide search in this page ---- */
function slideText(s){ var c=s.cloneNode(true); [].forEach.call(c.querySelectorAll("canvas,script,style,.st-mark,.myphotos,.mylinks"),function(n){n.remove();}); return (c.textContent||"").replace(/\s+/g," ").trim(); }
var TXT=null; function texts(){ if(!TXT) TXT=slides.map(slideText); return TXT; }
document.addEventListener("mp-edited",function(){ TXT=null; });
function findLocal(terms){ var out=[]; if(!slides.length) return out; var tx=texts();
  tx.forEach(function(t,i){ var lo=t.toLowerCase(), hit=-1, w=""; for(var k=0;k<terms.length;k++){ var p=lo.indexOf(terms[k].toLowerCase()); if(p>=0&&(hit<0||p<hit)){hit=p;w=terms[k];} }
    if(hit>=0) out.push({i:i,t:slides[i].getAttribute("data-title"),snip:snip(t,hit,w.length)}); });
  return out; }
function snip(t,p,l){ var a=Math.max(0,p-26), b=Math.min(t.length,p+l+38); return (a>0?"…":"")+esc(t.slice(a,p))+"<mark>"+esc(t.slice(p,p+l))+"</mark>"+esc(t.slice(p+l,b))+(b<t.length?"…":""); }
function curIdx(){ for(var i=0;i<slides.length;i++) if(slides[i].classList.contains("on")) return i; return 0; }
function goTo(i,terms){ var t=document.getElementById("toc"); if(t){ t.value=String(i); t.dispatchEvent(new Event("change")); } setTimeout(function(){ mark(slides[i],terms); },60); }
/* ---- highlight with CSS Custom Highlight API ---- */
function mark(root,terms){ if(!window.CSS||!CSS.highlights||!window.Highlight) return; CSS.highlights.delete("lk"); if(!root||!terms||!terms.length) return;
  var ranges=[], w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), n, first=null;
  while((n=w.nextNode())){ var v=n.nodeValue.toLowerCase(); terms.forEach(function(tm){ var q=tm.toLowerCase(), p=0; if(!q) return; while((p=v.indexOf(q,p))>=0){ var r=new Range(); r.setStart(n,p); r.setEnd(n,p+q.length); ranges.push(r); if(!first) first=n.parentElement; p+=q.length; } }); }
  if(ranges.length){ var h=new Highlight(); ranges.forEach(function(r){ h.add(r); }); CSS.highlights.set("lk",h); if(first&&first.scrollIntoView) first.scrollIntoView({block:"nearest"}); clearTimeout(mark.t); mark.t=setTimeout(function(){CSS.highlights.delete("lk");},6000); }
}
/* ---- UI ---- */
var btn=document.createElement("button"); btn.id="lkBtn"; btn.type="button"; btn.textContent="📖 용어"; btn.title="모르는 단어 찾기 — 슬라이드의 글자를 드래그하거나 두 번 눌러도 됩니다"; btn.setAttribute("aria-pressed","false");
var bar=document.querySelector("header.bar"); var st=bar&&bar.querySelector("#stBtn"), an=bar&&(bar.querySelector("#srchBtn")||bar.querySelector("#toc"));
if(bar){ if(st) bar.insertBefore(btn,st); else if(an&&an.nextSibling) bar.insertBefore(btn,an.nextSibling); else bar.appendChild(btn); } else { btn.classList.add("float"); document.body.appendChild(btn); }
var bub=document.createElement("button"); bub.id="lkBub"; bub.type="button"; bub.hidden=true; bub.textContent="🔍 찾아보기"; document.body.appendChild(bub);
var pn=document.createElement("aside"); pn.id="lkPanel"; pn.hidden=true; pn.setAttribute("aria-label","용어 찾기");
pn.innerHTML='<div class="hd"><b>📖 용어 찾기</b><button class="x" type="button" aria-label="닫기">✕</button></div><form><input id="lkQ" type="search" placeholder="단어 입력 (예: 연관통, TrP, 견갑거근)" autocomplete="off"><button type="submit">찾기</button></form><div id="lkBody"></div>';
document.body.appendChild(pn);
var inp=pn.querySelector("#lkQ"), body=pn.querySelector("#lkBody"), lastQ="", remote=[];
pn.querySelector(".x").onclick=function(){ open(false); };
pn.querySelector("form").onsubmit=function(e){ e.preventDefault(); run(inp.value); };
inp.addEventListener("keydown",function(e){ e.stopPropagation(); if(e.key==="Escape") open(false); });
var typT=0; inp.addEventListener("input",function(){ clearTimeout(typT); typT=setTimeout(function(){ run(inp.value); },250); });
function open(on){ pn.hidden=!on; btn.setAttribute("aria-pressed",on); if(on){ var sp=document.getElementById("stPanel"); if(sp&&!sp.hidden){ var x=sp.querySelector(".x"); if(x) x.click(); } } else if(window.CSS&&CSS.highlights) CSS.highlights.delete("lk"); }
btn.onclick=function(){ if(pn.hidden){ open(true); if(!inp.value) run(""); setTimeout(function(){inp.focus();},30); } else open(false); };
function webLinks(q,best){ var k=encodeURIComponent(q), e=best&&best.en?encodeURIComponent(best.en):"";
  var L=[["네이버 지식백과","terms.naver.com","https://terms.naver.com/search.naver?query="+k],["KMLE 의학 사전","의학용어·약어","https://www.kmle.co.kr/search.php?Search="+k],["위키백과","ko.wikipedia.org","https://ko.wikipedia.org/w/index.php?search="+k],["구글 검색","google.com","https://www.google.com/search?q="+k]];
  if(e) L.push(["PubMed 논문","영어: "+best.en,"https://pubmed.ncbi.nlm.nih.gov/?term="+e]);
  if(e) L.push(["YouTube 영상","영어: "+best.en,"https://www.youtube.com/results?search_query="+e]);
  return '<div class="lk-web">'+L.map(function(x){return '<a href="'+x[2]+'" target="_blank" rel="noopener">'+x[0]+'<small>'+esc(x[1])+'</small></a>';}).join("")+'</div>'; }
function card(g){ var ch=(g.ch||[]).map(function(n){return n+"장";}).join("·");
  return '<div class="lk-card"><div><span class="t">'+esc(g.t)+'</span><span class="en">'+esc(g.en||"")+'</span></div>'+((g.a&&g.a.length)?'<div class="al">다른 이름·약어: '+esc(g.a.join(", "))+'</div>':"")+'<p>'+esc(g.d)+'</p>'+(ch?'<div class="ch">주로 나오는 곳: '+ch+'</div>':"")+(window.__study&&window.__study.addMemo?'<button class="add" type="button" data-t="'+esc(g.t)+'">＋ 이 슬라이드 메모에 넣기</button>':"")+'</div>'; }
function azList(filter){ var f=norm(filter); var arr=G.slice().sort(function(a,b){return a.t.localeCompare(b.t,"ko");}); if(f) arr=arr.filter(function(g){ return [g.t,g.en].concat(g.a||[]).some(function(k){return norm(k).indexOf(f)>=0;}); });
  return '<div class="lk-az">'+arr.map(function(g){return '<button type="button" data-q="'+esc(g.t)+'">'+esc(g.t)+'</button>';}).join("")+'</div>'; }
function run(q){
  q=String(q||"").trim(); lastQ=q; inp.value=q;
  if(!q){ body.innerHTML='<p class="lk-tip">슬라이드에서 모르는 단어를 <b>두 번 누르거나 드래그</b>하면 <b>🔍 찾아보기</b>가 뜹니다. 휴대폰에서는 단어를 <b>길게 누르세요</b>.</p><h4>용어 사전 전체 ('+G.length+'개)</h4>'+azList(""); return; }
  var r=lookup(q), terms=termsFor(q,r.best), html="";
  html+=r.best?card(r.best):'<p class="lk-none">용어 사전에 <b>'+esc(q)+'</b>이(가) 없습니다. 아래 강의 속 위치나 인터넷 찾기를 이용하세요.</p>';
  if(r.sim.length) html+='<h4>비슷한 용어</h4><div class="lk-sim">'+r.sim.map(function(g){return '<button type="button" data-q="'+esc(g.t)+'">'+esc(g.t)+'</button>';}).join("")+'</div>';
  var loc=findLocal(terms);
  if(slides.length){ html+='<h4>이 장에서 나오는 곳 ('+loc.length+')</h4>'+(loc.length?loc.slice(0,30).map(function(h){return '<button class="lk-hit" type="button" data-i="'+h.i+'"><b>'+(h.i+1)+'. '+esc(h.t)+'</b><small>'+h.snip+'</small></button>';}).join(""):'<p class="lk-none">이 장에는 나오지 않습니다.</p>'); }
  if(inApp) html+='<div id="lkRemote"><h4>다른 장에서</h4><p class="lk-none">찾는 중…</p></div>';
  html+='<h4>인터넷에서 찾기</h4>'+webLinks(q,r.best);
  body.innerHTML=html; body.scrollTop=0;
  body._terms=terms;
  if(inApp){ try{ parent.postMessage({app:"mp",lookup:terms,from:MOD,q:q},"*"); }catch(e){} }
}
body.addEventListener("click",function(e){
  var b=e.target.closest("button"); if(!b) return;
  if(b.dataset.q){ run(b.dataset.q); return; }
  if(b.dataset.i!=null&&b.classList.contains("lk-hit")&&!b.dataset.m){ goTo(+b.dataset.i, body._terms); if(innerWidth<=640) open(false); return; }
  if(b.dataset.m){ try{ parent.postMessage({app:"mp",open:b.dataset.m,slide:(+b.dataset.i)+1,hl:body._terms},"*"); }catch(x){} return; }
  if(b.classList.contains("add")&&window.__study&&window.__study.addMemo){ var g=G.filter(function(x){return x.t===b.dataset.t;})[0]; if(g){ window.__study.addMemo("📖 "+g.t+(g.en?" ("+g.en+")":"")+": "+g.d); b.textContent="✓ 메모에 넣었습니다"; b.disabled=true; } }
});
window.addEventListener("message",function(ev){ if(ev.source!==window.parent&&ev.source!==window) return; var d=ev.data; if(!d||d.app!=="mp") return;
  if(d.lookupRes&&d.q===lastQ){ var host=document.getElementById("lkRemote"); if(!host) return; var L=d.lookupRes.filter(function(h){return h.m!==MOD;});
    host.innerHTML='<h4>다른 장에서 ('+L.length+')</h4>'+(L.length?L.slice(0,40).map(function(h){return '<button class="lk-hit" type="button" data-m="'+h.m+'" data-i="'+h.i+'"><b>'+esc(h.chap)+' · '+(h.i+1)+'. '+esc(h.t)+'</b><small>'+h.snip+'</small></button>';}).join(""):'<p class="lk-none">다른 장에는 나오지 않습니다.</p>'); }
  if(d.hl&&d.slide){ setTimeout(function(){ mark(slides[d.slide-1],d.hl); },350); }
});
/* ---- selection bubble ---- */
var selT=0, selText="";
function inUI(n){ while(n){ if(n.nodeType===1&&(n.isContentEditable||n.id==="lkPanel"||n.id==="stPanel"||n.id==="stBar"||n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.tagName==="SELECT")) return true; n=n.parentNode; } return false; }
function checkSel(){
  var s=window.getSelection(); if(!s||s.isCollapsed||!s.rangeCount){ bub.hidden=true; return; }
  var t=String(s).replace(/\s+/g," ").trim(); if(!t||t.length>40||inUI(s.anchorNode)){ bub.hidden=true; return; }
  if(document.body.classList.contains("st-pen")){ bub.hidden=true; return; }
  selText=t; var r=s.getRangeAt(0).getBoundingClientRect(); if(!r.width&&!r.height){ bub.hidden=true; return; }
  bub.hidden=false; var touch=matchMedia("(pointer:coarse)").matches, bw=bub.offsetWidth, bh=bub.offsetHeight;
  var x=Math.max(8,Math.min(innerWidth-bw-8,r.left+r.width/2-bw/2)), y=touch? r.bottom+12 : r.top-bh-8; if(y<8) y=r.bottom+8; if(y+bh>innerHeight-8) y=r.top-bh-8;
  bub.style.left=x+"px"; bub.style.top=y+"px";
}
document.addEventListener("selectionchange",function(){ clearTimeout(selT); selT=setTimeout(checkSel,180); });
window.addEventListener("scroll",function(){ bub.hidden=true; },true);
bub.addEventListener("mousedown",function(e){ e.preventDefault(); });
bub.onclick=function(){ bub.hidden=true; var q=selText; try{ window.getSelection().removeAllRanges(); }catch(e){} open(true); run(q); };
window.__lookup={run:function(q){open(true);run(q);},lookup:lookup,cands:cands};
})();
