
(function(){
"use strict";
var slides=[].slice.call(document.querySelectorAll(".slide"));
var toc=document.getElementById("toc");
function go(i){ toc.value=String(i); toc.dispatchEvent(new Event("change")); }
function cur(){ for(var i=0;i<slides.length;i++){ if(slides[i].classList.contains("on")) return i; } return 0; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function norm(s){ return String(s||"").replace(/\s+/g," ").trim(); }
function openOv(id){ var o=document.getElementById(id); o.hidden=false; var f=o.querySelector("input,select,button"); if(f) setTimeout(function(){f.focus();},30); }
function closeOv(id){ document.getElementById(id).hidden=true; }
[].forEach.call(document.querySelectorAll("[data-close]"),function(b){ b.onclick=function(){ closeOv(b.getAttribute("data-close")); }; });
[].forEach.call(document.querySelectorAll(".xov"),function(o){ o.addEventListener("click",function(e){ if(e.target===o) o.hidden=true; }); });

/* ===== 검색 ===== */
var HERE=slides.map(function(s,i){ var c=s.cloneNode(true); [].forEach.call(c.querySelectorAll(".mylinks,.myphotos,script"),function(n){n.remove();});
  return {i:i,n:i+1,t:s.dataset.title||"",g:s.dataset.group||"",x:norm(c.textContent)}; });
var COURSE=window.COURSE_IDX||null, scope="here", MYCH=window.CH_NO||0;
function enableCourse(){ document.getElementById("xsTabs").hidden=false;
  [].forEach.call(document.querySelectorAll("#xsTabs button"),function(b){ b.onclick=function(){ scope=b.getAttribute("data-scope");
    [].forEach.call(document.querySelectorAll("#xsTabs button"),function(x){x.setAttribute("aria-pressed",x===b);}); run(); }; }); }
if(COURSE) enableCourse();
else if(window.parent&&window.parent!==window){ /* 웹앱 안: 과정 색인을 틀에서 한 번 받아 씀 */
  window.addEventListener("message",function(e){ if(e.source!==window.parent&&e.source!==window) return; var d=e.data; if(d&&d.app==="mp"&&d.courseIdx&&!COURSE){ COURSE=d.courseIdx; enableCourse(); } });
  try{ parent.postMessage({app:"mp",courseGet:1},"*"); }catch(e){} }
var SYN=[["등세모근","승모근","trapezius"],["어깨올림근","견갑거근","levator"],["목빗근","흉쇄유돌근","scm"],["목갈비근","사각근","scalene"],["깊은목굽힘근","심부경추굴곡근","심부목굴곡근","긴목근","경장근"],["어깨세모근","삼각근","deltoid"],["가시아래근","극하근","infraspinatus"],["가시위근","극상근"],["큰가슴근","대흉근","pectoralis"],["넓은등근","광배근","latissimus"],["위팔두갈래근","상완이두근","biceps"],["위팔세갈래근","상완삼두근","triceps"],["폄근","신전근","extensor"],["굽힘근","굴곡근","flexor"],["척주세움근","척추기립근","척주기립근","erector"],["뭇갈래근","다열근","multifidus"],["허리네모근","요방형근"],["배가로근","복횡근"],["배곧은근","복직근"],["배바깥빗근","외복사근"],["골반바닥근","골반저근","골반기저근"],["가로막","횡격막","횡경막","diaphragm"],["등허리근막","흉요근막"],["엉덩허리근","장요근","iliopsoas","psoas"],["큰볼기근","대둔근"],["중간볼기근","중둔근"],["작은볼기근","소둔근"],["궁둥구멍근","이상근","piriformis"],["모음근","내전근","adductor"],["넙다리네갈래근","대퇴사두근","quadriceps"],["안쪽넓은근","내측광근","vmo"],["뒤넙다리근","햄스트링","슬괵근","hamstring"],["장딴지근","비복근","gastrocnemius"],["가자미근","soleus"],["앞정강근","전경골근"],["종아리근","비골근","peroneus","fibularis"],["족저근막","발바닥근막","plantar"],["통증유발점","트리거포인트","트리거 포인트","유발점","trigger","trp"],["연관통","방사통","referred"],["근막통증증후군","근막통증","mps"],["팔꿈치","팔꿉","주관절"],["엉덩관절","고관절"],["무릎관절","슬관절"],["발목관절","족관절"],["어깨뼈","견갑골"],["넙다리","대퇴"]];
function alts(t){ for(var i=0;i<SYN.length;i++){ for(var j=0;j<SYN[i].length;j++){ if(SYN[i][j]===t) return SYN[i]; } } return [t]; }
function has(hay,t){ var a=alts(t); for(var i=0;i<a.length;i++){ if(hay.indexOf(a[i])>=0) return a[i]; } return null; }
function snippet(x,terms){
  var lx=x.toLowerCase(), p=-1;
  for(var k=0;k<terms.length;k++){ var w=has(lx,terms[k])||terms[k], q=lx.indexOf(w); if(q>=0&&(p<0||q<p)) p=q; }
  var a=Math.max(0,p-45), s=(a>0?"…":"")+x.slice(a,a+150)+(a+150<x.length?"…":"");
  var h=esc(s);
  var all=[]; terms.forEach(function(t){ alts(t).forEach(function(a){ all.push(a); }); }); all.forEach(function(t){ if(!t) return; var re=new RegExp(esc(t).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"); h=h.replace(re,function(m){return "<mark>"+m+"</mark>";}); });
  return h;
}
function match(list,terms){
  var out=[];
  list.forEach(function(it){ var hay=(it.t+" "+it.x).toLowerCase(), ok=true, sc=0;
    for(var k=0;k<terms.length;k++){ var w=has(hay,terms[k]); if(!w){ok=false;break;} if(it.t.toLowerCase().indexOf(w)>=0) sc+=5; sc+=Math.min(5,hay.split(w).length-1); }
    if(ok) out.push({it:it,sc:sc}); });
  out.sort(function(a,b){ return b.sc-a.sc || (a.it.c||0)-(b.it.c||0) || a.it.n-b.it.n; });
  return out.slice(0,60);
}
var R=document.getElementById("xsR"), Q=document.getElementById("xsq"), H=document.getElementById("xsHint");
function run(){
  var q=norm(Q.value).toLowerCase(); R.innerHTML="";
  if(q.length<1){ H.textContent="단어 여러 개를 띄어 쓰면 모두 들어간 슬라이드만 찾습니다. 구용어·영문(예: 승모근, hamstring)도 6판 용어로 함께 찾습니다. 단축키: / 또는 Ctrl+K"; return; }
  var terms=q.split(" "), res=match(scope==="all"&&COURSE?COURSE:HERE,terms);
  H.textContent=res.length?("검색 결과 "+res.length+"건"+(res.length===60?"(상위 60건)":"")):"찾는 내용이 없습니다. 다른 낱말(구용어·영문)로도 찾아보세요.";
  res.forEach(function(r){ var it=r.it, li=document.createElement("li"), a=document.createElement("a");
    if(scope==="all"&&COURSE&&it.c===MYCH){ (function(n){ a.href="#slide-"+n; a.onclick=function(e){ e.preventDefault(); closeOv("xs"); go(n-1); }; })(it.n);
      a.innerHTML='<span class="xc">'+esc(it.c+"장 · 슬라이드 "+it.n)+' (이 강의안)</span><b>'+esc(it.t)+'</b><span class="xs">'+snippet(it.x,terms)+'</span>'; }
    else if(scope==="all"&&COURSE){ a.href=it.u+"#slide-"+it.n; a.target="_blank"; a.rel="noopener";
      a.innerHTML='<span class="xc">'+esc(it.c+"장 · 슬라이드 "+it.n)+'</span><b>'+esc(it.t)+'</b><span class="xs">'+snippet(it.x,terms)+'</span>'; }
    else { a.href="#slide-"+it.n; a.onclick=function(e){ e.preventDefault(); closeOv("xs"); go(it.i); };
      a.innerHTML='<span class="xc">슬라이드 '+it.n+(it.g?" · "+esc(it.g):"")+'</span><b>'+esc(it.t)+'</b><span class="xs">'+snippet(it.x,terms)+'</span>'; }
    li.appendChild(a); R.appendChild(li); });
}
var tmr=null; Q.addEventListener("input",function(){ clearTimeout(tmr); tmr=setTimeout(run,120); });
Q.addEventListener("keydown",function(e){ if(e.key==="Enter"){ var f=R.querySelector("a"); if(f) f.click(); } });
document.getElementById("srchBtn").onclick=function(){ openOv("xs"); };
document.addEventListener("keydown",function(e){
  var t=e.target.tagName;
  if(e.key==="Escape"){ closeOv("xs"); closeOv("xl"); closeOv("xp"); closeOv("xa"); var v=document.getElementById("xv"); if(v) v.hidden=true; return; }
  if(t==="INPUT"||t==="TEXTAREA"||t==="SELECT") return;
  if(e.key==="/"||((e.ctrlKey||e.metaKey)&&(e.key==="k"||e.key==="K"))){ e.preventDefault(); openOv("xs"); }
});

/* ===== 교수 YouTube 링크 (공유 저장소) ===== */
var YT=/^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[A-Za-z0-9_-]{6,}[^\s"'<>]*$/;
var addBtn=document.getElementById("myVidBtn"), M=document.getElementById("xlM"), S=document.getElementById("xlS");
var db=null, owner=false, rows=[];
function keyOf(s){ return s.dataset.title||""; }
function render(){
  [].forEach.call(document.querySelectorAll(".mylinks"),function(n){n.remove();});
  var by={}; rows.forEach(function(r){ if(typeof r.slide!=="string"||typeof r.url!=="string"||!YT.test(r.url)) return; (by[r.slide]=by[r.slide]||[]).push(r); });
  slides.forEach(function(s){ var list=by[keyOf(s)]; if(!list) return;
    var box=document.createElement("div"); box.className="mylinks";
    var h=document.createElement("b"); h.textContent="교수님이 추가한 영상"; box.appendChild(h);
    var wrap=document.createElement("div"); wrap.className="media"; box.appendChild(wrap);
    list.forEach(function(r){ var row=document.createElement("span"); row.className="myrow";
      var a=document.createElement("a"); a.href=r.url; a.target="_blank"; a.rel="noopener"; a.textContent="영상: "+(typeof r.title==="string"&&r.title?r.title:"YouTube 영상"); row.appendChild(a);
      if(owner){ var d=document.createElement("button"); d.type="button"; d.className="mydel"; d.textContent="삭제"; d.setAttribute("aria-label","이 영상 링크 삭제");
        d.onclick=function(){ if(d.dataset.arm!=="1"){ d.dataset.arm="1"; d.textContent="한 번 더 눌러 삭제"; setTimeout(function(){ d.dataset.arm=""; d.textContent="삭제"; },3000); return; }
          d.disabled=true; db.collection("links").doc(r.id).delete().catch(function(){ d.disabled=false; d.textContent="삭제 실패"; }); };
        row.appendChild(d); }
      wrap.appendChild(row); });
    (s.querySelector(".in")||s).appendChild(box); });
}
function fillSlides(){ S.innerHTML=""; slides.forEach(function(s,i){ var o=document.createElement("option"); o.value=i; o.textContent=(i+1)+". "+(s.dataset.title||""); S.appendChild(o); }); S.value=String(cur()); }
addBtn.onclick=function(){ fillSlides(); M.textContent=db?"":"이 보기에서는 공유 저장소를 쓸 수 없어 저장되지 않습니다(로그인 상태와 공유 설정을 확인하세요)."; openOv("xl"); };
document.getElementById("xlSave").onclick=function(){
  var u=norm(document.getElementById("xlU").value), n=norm(document.getElementById("xlN").value), i=+S.value, b=this;
  if(!YT.test(u)){ M.textContent="YouTube 영상 주소(youtube.com/watch?v=… 또는 youtu.be/…)를 넣어 주세요."; return; }
  if(!db){ M.textContent="공유 저장소를 쓸 수 없어 저장하지 못했습니다."; return; }
  b.disabled=true; M.textContent="저장 중…";
  db.collection("links").doc().set({slide:keyOf(slides[i]),title:n||"YouTube 영상",url:u,ts:Date.now()}).then(function(){
    M.textContent="추가했습니다. 슬라이드 "+(i+1)+" 아래에 나타납니다."; document.getElementById("xlU").value=""; document.getElementById("xlN").value=""; b.disabled=false;
  }).catch(function(e){ b.disabled=false; M.textContent=(e&&e.code==="quota_exceeded")?"저장 공간이 가득 찼습니다. 오래된 링크를 지운 뒤 다시 시도하세요.":"저장하지 못했습니다. 권한(소유자만 추가 가능)이나 연결을 확인하세요."; });
};
/* ===== 교수 사진 (공유 저장소 + 자산) ===== */
var picBtn=document.getElementById("myPicBtn"), PM=document.getElementById("xpM"), PS=document.getElementById("xpS"), PF=document.getElementById("xpF");
var assets=null, pics=[], view={list:[],i:0};
var IDRE=/^[A-Za-z0-9_-]{8,80}$/;
function renderPics(){
  [].forEach.call(document.querySelectorAll(".myphotos"),function(n){n.remove();});
  var by={}; pics.forEach(function(r){ if(typeof r.slide!=="string"||typeof r.asset!=="string"||!IDRE.test(r.asset)) return; (by[r.slide]=by[r.slide]||[]).push(r); });
  slides.forEach(function(s){ var list=by[keyOf(s)]; if(!list) return;
    var box=document.createElement("div"); box.className="myphotos";
    var h=document.createElement("b"); h.textContent="교수님이 올린 사진"; box.appendChild(h);
    var g=document.createElement("div"); g.className="mpgrid"; box.appendChild(g);
    list.forEach(function(r,k){ var f=document.createElement("figure");
      var bt=document.createElement("button"); bt.type="button"; bt.className="mpimg"; bt.setAttribute("aria-label","사진 크게 보기"+(r.cap?": "+r.cap:""));
      var im=document.createElement("img"); im.src="/_blob/"+r.asset; im.alt=typeof r.cap==="string"?r.cap:""; im.loading="lazy"; bt.appendChild(im);
      bt.onclick=function(){ openView(list,k); }; f.appendChild(bt);
      var fc=document.createElement("figcaption"); var t=document.createElement("span"); t.textContent=typeof r.cap==="string"&&r.cap?r.cap:"사진 "+(k+1); fc.appendChild(t);
      if(owner){ var d=document.createElement("button"); d.type="button"; d.className="mydel"; d.textContent="삭제"; d.setAttribute("aria-label","이 사진 삭제");
        d.onclick=function(){ if(d.dataset.arm!=="1"){ d.dataset.arm="1"; d.textContent="한 번 더"; setTimeout(function(){ d.dataset.arm=""; d.textContent="삭제"; },3000); return; }
          d.disabled=true; db.collection("photos").doc(r.id).delete().then(function(){ if(assets&&typeof assets.delete==="function") return assets.delete(r.asset).catch(function(){}); }).catch(function(){ d.disabled=false; d.textContent="삭제 실패"; }); };
        fc.appendChild(d); }
      f.appendChild(fc); g.appendChild(f); });
    var mount=s.querySelector(".in")||s, ml=mount.querySelector(".mylinks");
    if(ml) mount.insertBefore(box,ml); else mount.appendChild(box); });
}
var XV=document.getElementById("xv"), XI=document.getElementById("xvI"), XC=document.getElementById("xvC"), XP=document.getElementById("xvP"), XN=document.getElementById("xvN");
function showView(){ var r=view.list[view.i]; XI.src="/_blob/"+r.asset; XI.alt=r.cap||""; XC.textContent=(r.cap||"")+(view.list.length>1?"  ("+(view.i+1)+"/"+view.list.length+")":""); XP.hidden=XN.hidden=view.list.length<2; }
function openView(list,i){ view={list:list,i:i}; showView(); XV.hidden=false; document.getElementById("xvX").focus(); }
document.getElementById("xvX").onclick=function(){ XV.hidden=true; };
XP.onclick=function(){ view.i=(view.i-1+view.list.length)%view.list.length; showView(); };
XN.onclick=function(){ view.i=(view.i+1)%view.list.length; showView(); };
XV.addEventListener("click",function(e){ if(e.target===XV) XV.hidden=true; });
document.addEventListener("keydown",function(e){ if(XV.hidden) return; if(e.key==="ArrowLeft"){ e.stopPropagation(); XP.click(); } if(e.key==="ArrowRight"){ e.stopPropagation(); XN.click(); } },true);
function shrink(file){ return new Promise(function(res){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){ res(file); return; }
  var u=URL.createObjectURL(file), im=new Image();
  im.onload=function(){ var m=2000, w=im.naturalWidth, h=im.naturalHeight, k=Math.min(1,m/Math.max(w,h));
    if(k===1&&file.size<2.5e6){ URL.revokeObjectURL(u); res(file); return; }
    var c=document.createElement("canvas"); c.width=Math.round(w*k); c.height=Math.round(h*k); c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    c.toBlob(function(b){ URL.revokeObjectURL(u); res(b&&b.size<file.size?b:file); },"image/jpeg",0.86); };
  im.onerror=function(){ URL.revokeObjectURL(u); res(file); }; im.src=u; }); }
PF.onchange=function(){ var pv=document.getElementById("xpPrev"); pv.innerHTML=""; [].slice.call(PF.files||[]).slice(0,12).forEach(function(f){ var i=document.createElement("img"); i.alt=""; i.src=URL.createObjectURL(f); pv.appendChild(i); }); };
function fillPS(){ PS.innerHTML=""; slides.forEach(function(s,i){ var o=document.createElement("option"); o.value=i; o.textContent=(i+1)+". "+(s.dataset.title||""); PS.appendChild(o); }); PS.value=String(cur()); }
picBtn.onclick=function(){ fillPS(); PM.textContent=(db&&assets)?"":"이 보기에서는 사진을 저장할 수 없습니다(소유자로 로그인했는지 확인하세요)."; openOv("xp"); };
document.getElementById("xpSave").onclick=function(){
  var files=[].slice.call(PF.files||[]), n=norm(document.getElementById("xpN").value), i=+PS.value, b=this, done=0;
  if(!files.length){ PM.textContent="사진 파일을 골라 주세요."; return; }
  if(!db||!assets){ PM.textContent="저장소를 쓸 수 없어 올리지 못했습니다."; return; }
  b.disabled=true; PM.textContent="올리는 중… 0/"+files.length;
  var seq=Promise.resolve(), fail=0;
  files.forEach(function(f,k){ seq=seq.then(function(){ return shrink(f); }).then(function(bl){ return assets.upload(bl); }).then(function(a){
      return db.collection("photos").doc().set({slide:keyOf(slides[i]),asset:a.id,cap:n?(files.length>1?n+" ("+(k+1)+")":n):"",ts:Date.now()+k}); })
    .then(function(){ done++; PM.textContent="올리는 중… "+done+"/"+files.length; },function(){ fail++; }); });
  seq.then(function(){ b.disabled=false; PM.textContent=fail?("완료 "+done+"장, 실패 "+fail+"장(파일 형식·용량 20MB 이하인지 확인하세요)."):("올렸습니다. 슬라이드 "+(i+1)+" 아래에 나타납니다.");
    if(!fail){ PF.value=""; document.getElementById("xpPrev").innerHTML=""; document.getElementById("xpN").value=""; } });
};
/* ===== 퀴즈 결과 수집과 수업 분석 ===== */
var anaBtn=document.getElementById("anaBtn"), userNS=null, results=null, anaSub=false;
var META=window.QUIZ_META||null;
document.addEventListener("quizsubmit",function(e){
  if(!db||!userNS||!META||!e.detail) return;
  var d=e.detail; if(!Array.isArray(d.ans)||d.ans.length!==META.length) return;
  Promise.resolve(userNS.id()).then(function(id){ if(!id) return;
    return db.collection("results").doc(String(id)).set({ts:Date.now(),n:META.length,ans:d.ans,conf:d.conf.map(function(c){return typeof c==="number"?c:-1;})}); }).catch(function(){});
});
function pct(a,b){ return b?Math.round(a/b*100):0; }
var TN={mem:"암기",int:"해석",sol:"해결",cas:"사례"};
function renderAna(){
  var B=document.getElementById("xaB"); if(!META){ B.innerHTML='<p class="xhint">이 강의안에는 퀴즈가 없습니다.</p>'; return; }
  if(results===null){ B.innerHTML='<p class="xhint">불러오는 중…</p>'; return; }
  var rs=results.filter(function(r){ return r&&r.n===META.length&&Array.isArray(r.ans)&&r.ans.length===META.length; });
  var N=rs.length;
  if(!N){ B.innerHTML='<p>아직 제출한 학생이 없습니다.</p><p class="xhint">학생이 퀴즈를 끝까지 풀고 제출하면 이름 없이 여기에 모입니다. 학생이 결과를 보내려면 이 강의안을 ‘참여(Contributor)’ 이상 권한으로 공유해야 할 수 있습니다.</p>'; return; }
  var items=META.map(function(m,k){ var c=0,mis=0,unl=0; rs.forEach(function(r){ var ok=r.ans[k]===1, cf=r.conf?r.conf[k]:-1; if(ok)c++; else if(cf===0) mis++; else unl++; }); return {k:k,m:m,c:c,mis:mis,unl:unl}; });
  var tot=0; rs.forEach(function(r){ tot+=r.ans.reduce(function(a,b){return a+b;},0); });
  var byLo={}, byT={}; items.forEach(function(it){ var l=it.m.lo, t=it.m.t; (byLo[l]=byLo[l]||[0,0]); byLo[l][0]+=it.c; byLo[l][1]+=N; (byT[t]=byT[t]||[0,0]); byT[t][0]+=it.c; byT[t][1]+=N; });
  var misAll=items.reduce(function(a,it){return a+it.mis;},0);
  var sorted=items.slice().sort(function(a,b){ return (b.mis-a.mis)||(a.c-b.c)||(a.k-b.k); });
  var hot=sorted.filter(function(it){ return it.mis>0||it.c/N<0.6; }).slice(0,5).map(function(it){return it.k;});
  var h='<div class="anas"><div><b>'+N+'명</b><span>제출한 학생</span></div><div><b>'+pct(tot,N*META.length)+'%</b><span>평균 정답률</span></div><div><b>'+pct(misAll,N*META.length)+'%</b><span>오개념(확신했는데 틀림) 비율</span></div><div><b>'+hot.length+'개</b><span>다시 설명할 문항(빨간 줄)</span></div></div>';
  if(N<5) h+='<p class="xhint">응답이 '+N+'명이라 비율이 크게 흔들릴 수 있습니다.</p>';
  h+='<b>학습목표별 정답률</b><div class="anlo">'+Object.keys(byLo).sort().map(function(l){var v=byLo[l];return '<span>'+esc(l)+' <b>'+pct(v[0],v[1])+'%</b></span>';}).join("")+'</div>';
  h+='<b>유형별 정답률</b><div class="anlo">'+["mem","int","sol","cas"].filter(function(t){return byT[t];}).map(function(t){var v=byT[t];return '<span>'+TN[t]+' <b>'+pct(v[0],v[1])+'%</b></span>';}).join("")+'</div>';
  h+='<table class="anat"><thead><tr><th>문항</th><th>목표·유형</th><th>정답률</th><th>오개념</th><th>문제</th></tr></thead><tbody>';
  sorted.forEach(function(it){ var p=pct(it.c,N), q=pct(it.mis,N);
    h+='<tr class="'+(hot.indexOf(it.k)>=0?'hot':'')+'"><td>'+(it.k+1)+'</td><td>'+esc(it.m.lo)+'<br><small>'+(TN[it.m.t]||"")+'</small></td><td><span class="abar" style="width:'+Math.max(2,p*0.6)+'px"></span>'+p+'%</td><td><span class="abar mis" style="width:'+Math.max(2,q*0.6)+'px"></span>'+q+'%</td><td class="q"><button type="button" data-q="'+it.k+'">'+esc(String(it.m.s).replace(/\n[\s\S]*/,"").slice(0,90))+'</button></td></tr>'; });
  h+='</tbody></table><p class="qnote">오개념 = 확신한다고 고르고 틀린 비율. 빨간 줄은 오개념이 있거나 정답률 60% 미만인 문항 중 상위 5개입니다. 문제를 누르면 그 문항으로 갑니다. 학생 이름은 저장하지 않으며, 같은 학생이 다시 제출하면 마지막 결과로 바뀝니다.</p>';
  B.innerHTML=h;
  [].forEach.call(B.querySelectorAll("[data-q]"),function(b){ b.onclick=function(){ closeOv("xa"); var qs=document.getElementById("quiz"); if(qs){ var i=slides.indexOf(qs); if(i>=0) go(i); } try{ document.dispatchEvent(new CustomEvent("quizgoto",{detail:+b.dataset.q})); }catch(e){} }; });
}
anaBtn.onclick=function(){ openOv("xa"); renderAna();
  if(!anaSub&&db){ anaSub=true; try{ db.collection("results").onSnapshot(function(snap){ results=snap.docs.map(function(d){return d.data()||{};}); renderAna(); },function(){ results=[]; document.getElementById("xaB").innerHTML='<p>결과를 불러오지 못했습니다(소유자로 로그인했는지 확인하세요).</p>'; }); }catch(e){ results=[]; renderAna(); } }
};
if(window.claude&&typeof window.claude.use==="function"){
  Promise.all([window.claude.use("db"),window.claude.use("user"),window.claude.use("assets")]).then(function(v){
    db=v[0]; var user=v[1]; userNS=user||null; assets=v[2]||null;
    if(db&&META){ var qi=document.getElementById("quiz"); if(qi&&!qi.querySelector(".qsend")){ var pn=document.createElement("p"); pn.className="qsend"; pn.textContent="제출한 답과 확신도는 이름 없이 교수님의 수업 분석에 모입니다."; qi.appendChild(pn); } }
    return Promise.resolve(user&&typeof user.isOwner==="function"?user.isOwner():false).then(function(o){ owner=!!o; if(owner){ addBtn.hidden=false; if(assets) picBtn.hidden=false; if(db&&META) anaBtn.hidden=false; } });
  }).then(function(){
    if(!db) return;
    db.collection("links").orderBy("ts").onSnapshot(function(snap){ rows=snap.docs.map(function(d){ var o=d.data()||{}; return {id:d.id,slide:o.slide,title:o.title,url:o.url}; }); render(); }, function(){});
    db.collection("photos").orderBy("ts").onSnapshot(function(snap){ pics=snap.docs.map(function(d){ var o=d.data()||{}; return {id:d.id,slide:o.slide,asset:o.asset,cap:o.cap}; }); renderPics(); }, function(){});
  }).catch(function(){});
}
})();
