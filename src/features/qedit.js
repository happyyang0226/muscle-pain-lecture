/* ===== 4단계: ✎ 퀴즈 편집기(교수용) =====
   문항·보기·정답·보기별 해설·핵심 정리·학습목표·유형·국시 영역을 고친다.
   - 저장: localStorage "mp-qedit-v1" = {ts, mods:{장:{문항번호(0부터):{s,o,a,w,c,lo,t,area}}}}
   - 반영: 각 장 퀴즈(장을 열 때 끼워 넣음) · 복습 · 모의고사 · 결과 분석에 모두 반영
   - 장 문항을 고치면 같은 문항이 들어 있는 종합평가 문항에도 함께 반영
   - '수정본 파일로 저장'을 누르면 편집 내용이 새 웹앱 파일 안에 들어간다(id="mp-qedit-baked") */
(function(){
"use strict";
var esc=MP.esc, KEY="mp-qedit-v1", FIELDS=["s","o","a","w","c","lo","t","area"], RAWB=null, chSel="ch1", open=null;
function baked(){ var el=document.getElementById("mp-qedit-baked"); if(!el) return {}; try{ return JSON.parse(el.textContent).mods||{}; }catch(e){ return {}; } }
function local(){ try{ return (JSON.parse(localStorage.getItem(KEY)||"null")||{}).mods||{}; }catch(e){ return {}; } }
var BASE=baked(), MINE=local();
function all(){ var out={}; [BASE,MINE].forEach(function(src){ Object.keys(src).forEach(function(m){ out[m]=out[m]||{}; Object.keys(src[m]).forEach(function(i){ out[m][i]=Object.assign({},out[m][i]||{},src[m][i]); }); }); }); return out; }
function saveMine(){ try{ localStorage.setItem(KEY,JSON.stringify({ts:Date.now(),mods:MINE})); }catch(e){} }
function count(E){ E=E||all(); return Object.keys(E).reduce(function(n,m){ return n+Object.keys(E[m]).length; },0); }
/* 장 문항 편집 → 종합평가 같은 문항에도 */
function withFinal(E){ if(!RAWB||!RAWB.mods.final) return E; var out=JSON.parse(JSON.stringify(E)); out.final=out.final||{};
  RAWB.mods.final.q.forEach(function(q,i){ if(!q.same) return; var p=q.same.split("-"), m=p[0], k=+p[1]-1; if(E[m]&&E[m][k]&&!(E.final&&E.final[i])) out.final[i]=E[m][k]; });
  if(!Object.keys(out.final).length) delete out.final; return out; }
MP.data("qbank").then(function(b){ RAWB=b; });

/* 1) 문제은행(복습·모의고사·분석)에 반영 */
MP.qbankFilters.push(function(b){ var E=withFinal(all()); if(!count(E)) return b; var c=JSON.parse(JSON.stringify(b));
  Object.keys(E).forEach(function(m){ if(!c.mods[m]) return; Object.keys(E[m]).forEach(function(i){ var q=c.mods[m].q[+i]; if(!q) return; FIELDS.forEach(function(f){ if(E[m][i][f]!=null) q[f]=E[m][i][f]; }); q.edited=1; }); });
  return c; });
/* 2) 각 장 퀴즈에 반영: 장을 열 때 퀴즈 자료(Q)를 덮어쓴다 */
MP.hooks.push(function(k,html){ var E=withFinal(all())[k]; if(!E||!Object.keys(E).length) return html; var i=html.indexOf("window.QUIZ_META="); if(i<0) return html;
  var js="(function(E){Object.keys(E).forEach(function(i){var q=Q[+i],e=E[i];if(!q)return;['s','o','a','w','c','lo','t'].forEach(function(f){if(e[f]!=null)q[f]=e[f];});});})("+JSON.stringify(E).replace(/</g,"\\u003c")+");";
  return html.slice(0,i)+js+html.slice(i); });
/* 3) 수정본 파일에 넣기 */
MP_BAKERS.push({count:function(){ return count(MINE); }, run:function(root){ var el=root.querySelector("#mp-qedit-baked"); if(!el){ el=document.createElement("script"); el.type="application/json"; el.id="mp-qedit-baked"; root.querySelector("head").appendChild(el); }
  el.textContent=JSON.stringify({v:1,at:Date.now(),mods:all()}).replace(/</g,"\\u003c"); }});
function refresh(m){ [m,"final"].forEach(function(k){ var f=MP.frames[k]; if(f){ f.remove(); delete MP.frames[k]; } }); if(MP.study&&MP.study.reload) MP.study.reload(); }

/* ---------- 화면 ---------- */
var el=MP.page("qedit","퀴즈 편집",function(){ draw(); });
function draw(){ el.innerHTML='<div class="wrap"><p class="muted">문제은행을 불러오는 중…</p></div>';
  MP.qbank().then(function(b){ var mods=Object.keys(b.mods).filter(function(m){ return m!=="final"; }); var E=all(), n=count(E);
    var h='<div class="wrap"><div class="pg-head"><div><h1>✎ 퀴즈 편집</h1><p class="lead">문항을 눌러 문제·보기·정답·해설·국시 영역을 고칩니다. 고친 내용은 각 장 퀴즈, 복습, 모의고사, 결과 분석에 바로 반영되고, 처음 화면의 <b>수정본 파일로 저장</b>을 누르면 새 웹앱 파일에 함께 들어갑니다.</p></div><button class="btn" data-home="1">← 처음 화면</button></div>';
    h+='<div class="panel warn small">정답 번호나 보기를 바꾸면, 이미 그 장 퀴즈를 제출한 학생 기록은 바뀐 정답 기준으로 다시 채점되어 보입니다. 학기 중에는 오탈자·해설 위주로 고치고, 정답 변경은 학기 시작 전에 하세요. 종합평가의 같은 문항에도 함께 반영됩니다.</div>';
    h+='<div class="row" style="justify-content:space-between;margin:8px 0"><div class="seg" id="qeCh">'+mods.map(function(m){ var c=E[m]?Object.keys(E[m]).length:0; return '<button type="button" data-ch="'+m+'" aria-pressed="'+(chSel===m)+'">'+esc(MP.T[m].split(" ")[0])+(c?' <b style="color:#1f8a4c">·'+c+'</b>':'')+'</button>'; }).join("")+'</div>';
    h+='<div class="row"><span class="small muted">고친 문항 '+n+'개</span><button class="btn sm" id="qeExp"'+(n?"":" disabled")+'>편집 내보내기</button><label class="btn sm">불러오기<input type="file" id="qeImp" accept=".json" hidden></label><button class="btn sm danger" id="qeClr"'+(count(MINE)?"":" disabled")+'>모두 되돌리기</button></div></div>';
    h+='<div id="qeList">'+b.mods[chSel].q.map(function(q,i){ var ed=E[chSel]&&E[chSel][i]; return '<div class="qcard" data-i="'+i+'" style="padding:10px 14px;margin:6px 0">'+(open===i?form(b,q,i,ed):'<div class="row" style="flex-wrap:nowrap;justify-content:space-between;gap:10px;cursor:pointer" data-open="'+i+'"><span><b>'+(i+1)+'.</b> '+esc(q.s)+' <span class="tag">'+esc(q.lo)+'</span>'+(ed?' <span class="tag green">고침</span>':'')+'</span><span class="btn sm">고치기</span></div>')+'</div>'; }).join("")+'</div></div>';
    el.innerHTML=h; bind(b); }); }
function form(b,q,i,ed){ var A=b.areas, h='<div class="row" style="justify-content:space-between"><b>'+(i+1)+'번 문항 고치기</b>'+(ed?'<span class="tag green">고친 문항</span>':'')+'</div>';
  h+='<div class="field"><label>문제</label><textarea id="qeS">'+esc(q.s)+'</textarea></div><div class="field"><label>보기(정답에 ● 표시) · 보기별 해설</label><div class="optedit">';
  q.o.forEach(function(o,k){ h+='<input type="radio" name="qeA" value="'+k+'"'+(q.a===k?" checked":"")+' aria-label="'+(k+1)+'번을 정답으로"><div><input class="qeO" data-k="'+k+'" value="'+esc(o)+'" aria-label="보기 '+(k+1)+'" style="font:inherit;font-size:14px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;width:100%;background:var(--paper);color:inherit"><input class="qeW" data-k="'+k+'" value="'+esc((q.w||[])[k]||"")+'" placeholder="이 보기를 고르면 보여 줄 해설" aria-label="보기 '+(k+1)+' 해설" style="font:inherit;font-size:12.5px;border:1px dashed var(--line);border-radius:8px;padding:5px 8px;width:100%;margin-top:3px;background:var(--paper);color:var(--muted)"></div>'; });
  h+='</div></div><div class="field"><label>핵심 정리(정답 뒤에 보임)</label><textarea id="qeC">'+esc(q.c||"")+'</textarea></div>';
  h+='<div class="row" style="gap:12px"><div class="field" style="flex:1;min-width:120px"><label>학습목표</label><input id="qeLo" value="'+esc(q.lo)+'"></div><div class="field" style="flex:1;min-width:120px"><label>유형</label><select id="qeT">'+Object.keys(b.types).map(function(t){ return '<option value="'+t+'"'+(q.t===t?" selected":"")+'>'+esc(b.types[t])+'</option>'; }).join("")+'</select></div><div class="field" style="flex:2;min-width:220px"><label>국시 영역</label><select id="qeArea">'+Object.keys(A).map(function(a){ return '<option value="'+a+'"'+(q.area===a?" selected":"")+'>'+esc(A[a].s+" · "+A[a].n)+'</option>'; }).join("")+'</select></div></div>';
  h+='<div id="qeErr" class="small" style="color:#b4233c" aria-live="polite"></div><div class="qnav"><button class="btn primary" id="qeSave">저장</button><button class="btn" id="qeCancel">닫기</button>'+(MINE[chSel]&&MINE[chSel][i]?'<button class="btn danger" id="qeUndo">이 문항 원래대로</button>':'')+'</div>';
  return h; }
function bind(b){
  el.querySelector("#qeCh").onclick=function(e){ var t=e.target.closest("[data-ch]"); if(!t) return; chSel=t.getAttribute("data-ch"); open=null; draw(); };
  [].forEach.call(el.querySelectorAll("[data-open]"),function(r){ r.onclick=function(){ open=+r.getAttribute("data-open"); draw(); setTimeout(function(){ var f=el.querySelector('[data-i="'+open+'"]'); if(f){ f.scrollIntoView({block:"start"}); var s=f.querySelector("#qeS"); if(s) s.focus(); } },30); }; });
  var sv=el.querySelector("#qeSave"); if(sv) sv.onclick=function(){ var q=b.mods[chSel].q[open], v={s:val("#qeS"),o:[].map.call(el.querySelectorAll(".qeO"),function(x){ return x.value.trim(); }),w:[].map.call(el.querySelectorAll(".qeW"),function(x){ return x.value.trim(); }),
      a:+((el.querySelector('input[name=qeA]:checked')||{}).value),c:val("#qeC"),lo:val("#qeLo"),t:el.querySelector("#qeT").value,area:el.querySelector("#qeArea").value};
    var err=!v.s?"문제를 입력하세요.":v.o.some(function(x){ return !x; })?"보기 5개를 모두 입력하세요.":(new Set(v.o)).size!==v.o.length?"같은 보기가 있습니다.":isNaN(v.a)?"정답을 고르세요.":"";
    if(err){ el.querySelector("#qeErr").textContent=err; return; }
    var orig=RAWB.mods[chSel].q[open], diff={}; FIELDS.forEach(function(f){ if(JSON.stringify(v[f])!==JSON.stringify(orig[f])) diff[f]=v[f]; });
    MINE[chSel]=MINE[chSel]||{}; if(Object.keys(diff).length) MINE[chSel][open]=diff; else delete MINE[chSel][open]; if(!Object.keys(MINE[chSel]).length) delete MINE[chSel];
    saveMine(); refresh(chSel); open=null; draw(); MP.say&&MP.say("저장했습니다"); };
  var cc=el.querySelector("#qeCancel"); if(cc) cc.onclick=function(){ open=null; draw(); };
  var un=el.querySelector("#qeUndo"); if(un) un.onclick=function(){ delete MINE[chSel][open]; if(!Object.keys(MINE[chSel]).length) delete MINE[chSel]; saveMine(); refresh(chSel); open=null; draw(); };
  var ex=el.querySelector("#qeExp"); if(ex) ex.onclick=function(){ MP.download("퀴즈편집_"+MP.stamp()+".json",JSON.stringify({app:"qedit",v:1,mods:all()},null,1),"application/json"); };
  el.querySelector("#qeImp").onchange=function(){ var f=this.files&&this.files[0], inp=this; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ var o=JSON.parse(r.result); if(!o||o.app!=="qedit"||!o.mods) throw 0;
      Object.keys(o.mods).forEach(function(m){ if(!RAWB.mods[m]) return; MINE[m]=Object.assign(MINE[m]||{},o.mods[m]); refresh(m); }); saveMine(); draw(); }catch(e){ var w=document.createElement("div"); w.className="panel warn"; w.textContent="퀴즈 편집 파일(.json)이 아닙니다."; el.querySelector(".wrap").prepend(w); setTimeout(function(){ w.remove(); },3000); } inp.value=""; }; r.readAsText(f); };
  var arm=0, cl=el.querySelector("#qeClr"); if(cl) cl.onclick=function(){ if(!arm){ arm=1; cl.textContent="정말 모두 되돌릴까요?"; setTimeout(function(){ arm=0; cl.textContent="모두 되돌리기"; },3000); return; } Object.keys(MINE).forEach(refresh); MINE={}; saveMine(); draw(); };
}
function val(s){ return (el.querySelector(s).value||"").trim(); }
el.addEventListener("click",function(e){ if(e.target.closest("[data-home]")) MP.show("home"); });
MP.qedit={all:all,count:count};
})();
