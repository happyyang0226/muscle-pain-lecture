/* ===== 1단계: 백업 알림 · 저장 공간 표시 · 백업에 퀴즈·복습 기록 포함 · 알림 낭독 ===== */
(function(){
"use strict";
var LAST="mp-lastbackup", FIRST="mp-firstuse", DAY=864e5;
function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }
function say(t){ var l=document.getElementById("mpLive"); if(!l) return; l.textContent=""; setTimeout(function(){ l.textContent=t; },60); }
MP.say=say;

/* 이 앱이 브라우저에 남기는 모든 학습 기록 키 */
function myKeys(){ var out=[]; try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(/^mp-|^(ch\d|final)-quiz-v\d+$/.test(k)&&k!=="mp-t") out.push(k); } }catch(e){} return out; }
function usage(){ var b=0; myKeys().forEach(function(k){ var v=ls(k)||""; b+=(k.length+v.length)*2; }); return b; }
function kb(n){ return n<1024*1024?Math.round(n/1024)+"KB":(n/1048576).toFixed(1)+"MB"; }
function hasLearning(){ var n=0, N=MP.notes(); Object.keys(N).forEach(function(m){ n+=Object.keys(N[m]||{}).length; });
  return n>0 || myKeys().some(function(k){ return /-quiz-v\d+$|^mp-study-|^mp-cases-|^mp-fq-/.test(k); }); }
MP.hasLearning=hasLearning;

/* ---- 백업 v2: 노트 + 퀴즈 기록 + 복습·증례·모의고사 기록 ---- */
function backupObj(){ var extra={}; myKeys().forEach(function(k){ if(/^mp-notes-v1:|^mp-edits-v1:|^mp-edit-on$|^mp-last|^mp-firstuse$|^mp-qedit-/.test(k)) return; extra[k]=ls(k); });
  return {app:"muscle-pain-notes",v:2,at:Date.now(),notes:MP.notes(),extra:extra}; }
function markBackup(){ ls(LAST,String(Date.now())); MP.onHome.forEach(function(fn){ try{ fn(); }catch(e){} }); notesBanner(); }
document.getElementById("npBackup").onclick=function(){ MP.download("내노트_백업_"+MP.stamp()+".json",JSON.stringify(backupObj()),"application/json"); markBackup(); MP.flashNp("백업 파일을 저장했습니다(노트·퀴즈 기록·복습 기록 포함)"); };
var saveBtn=document.getElementById("npSave"), oldSave=saveBtn.onclick; saveBtn.onclick=function(){ oldSave&&oldSave.apply(this,arguments); markBackup(); };
MP.backupNow=function(){ document.getElementById("npBackup").click(); };

/* 불러오기: 노트는 최신 것으로 합치고, 기록(extra)은 비어 있는 것만 채우거나 더 진행된 쪽을 남긴다 */
function mergeExtra(src){ var n=0; Object.keys(src||{}).forEach(function(k){
    if(!/^mp-study-|^mp-cases-|^mp-fq-|^(ch\d|final)-quiz-v\d+$/.test(k)||typeof src[k]!=="string") return;
    var mine=ls(k); if(mine==null){ ls(k,src[k]); n++; return; }
    try{ var a=JSON.parse(mine), b=JSON.parse(src[k]);
      if(/-quiz-v\d+$/.test(k)){ var ca=Object.keys(a.ans||{}).length+(a.done?100:0), cb=Object.keys(b.ans||{}).length+(b.done?100:0); if(cb>ca){ ls(k,src[k]); n++; } return; }
      if(k==="mp-study-v1"&&MP.study&&MP.study.merge){ MP.study.merge(b); n++; return; }
      if((b.ts||0)>(a.ts||0)){ ls(k,src[k]); n++; }
    }catch(e){} });
  return n; }
document.getElementById("npImport").onchange=function(){ var f=this.files&&this.files[0], inp=this; if(!f) return; var r=new FileReader();
  r.onload=function(){ try{ var o=JSON.parse(r.result); var src=o&&o.notes; if(!src||typeof src!=="object") throw 0; var n=0, N=MP.notes();
      Object.keys(src).forEach(function(m){ if(!MP.T[m]||!src[m]||typeof src[m]!=="object") return; var mine=N[m]||{};
        Object.keys(src[m]).forEach(function(k){ var a=mine[k], b=src[m][k]; if(!b||typeof b!=="object") return; if(!a||(b.ts||0)>(a.ts||0)){ mine[k]=b; n++; } }); MP.putNotes(m,mine); MP.pushNotes(m); });
      var x=mergeExtra(o.extra);
      MP.renderNotes(); MP.flashNp("백업에서 노트 "+n+"개"+(x?", 학습 기록 "+x+"개":"")+"를 합쳤습니다"); }
    catch(e){ MP.flashNp("백업 파일을 읽지 못했습니다(이 웹앱의 ‘백업 내보내기’ 파일인지 확인하세요)"); } inp.value=""; };
  r.readAsText(f); };

/* ---- 알림 문구 ---- */
function backupState(){ if(!MP.lsok||!hasLearning()) return null;
  var now=Date.now(), last=+ls(LAST)||0, first=+ls(FIRST)||0; if(!first){ first=now; ls(FIRST,String(now)); }
  var since=last?Math.floor((now-last)/DAY):Math.floor((now-first)/DAY);
  if(last&&since<7) return null; if(!last&&since<3) return null;
  return {days:since,never:!last}; }
function alertHTML(st){ return st.never?("학습 기록을 남긴 지 <b>"+st.days+"일</b>이 지났는데 아직 백업한 적이 없습니다. 브라우저 기록을 지우거나 다른 컴퓨터를 쓰면 사라질 수 있어요.")
  :("마지막 백업 후 <b>"+st.days+"일</b>이 지났습니다. 그동안 남긴 필기와 퀴즈 기록을 백업해 두세요."); }
function homeAlert(){ var el=document.getElementById("homeAlert"); if(!el) return; var h="", st=backupState();
  if(st) h+='<div class="home-alert warn" role="status"><span>💾 '+alertHTML(st)+'</span><button type="button" class="btn sm" id="haBackup">지금 백업하기</button></div>';
  var due=MP.study&&MP.study.dueCount?MP.study.dueCount():0;
  if(due) h+='<div class="home-alert go"><span>📚 오늘 복습할 문항이 <b>'+due+'개</b> 있습니다. 5분이면 끝나요.</span><button type="button" class="btn sm green" id="haReview">복습 시작</button></div>';
  el.innerHTML=h;
  var b=document.getElementById("haBackup"); if(b) b.onclick=function(){ MP.backupNow(); };
  var r=document.getElementById("haReview"); if(r) r.onclick=function(){ MP.show("review","today"); }; }
MP.onHome.push(homeAlert);

/* 내 노트 화면: 저장 공간 표시와 백업 알림 */
function notesBanner(){ var page=document.getElementById("notesPage"); if(!page) return; var box=document.getElementById("npCare");
  if(!box){ box=document.createElement("div"); box.id="npCare"; var st=document.getElementById("npStats"); st.parentNode.insertBefore(box,st.nextSibling); }
  var u=usage(), cap=5*1048576, pct=Math.min(100,Math.round(u/cap*100)), st2=backupState(), h="";
  h+='<div class="small muted" style="margin:-6px 0 12px">이 브라우저에 저장된 학습 기록 <b>'+kb(u)+'</b> / 약 5MB ('+pct+'%)'+(ls(LAST)?' · 마지막 백업 '+new Date(+ls(LAST)).toLocaleDateString("ko-KR"):' · 아직 백업 없음')+'</div>';
  if(pct>=70) h+='<div class="np-warn">저장 공간이 거의 찼습니다('+pct+'%). 펜 필기가 많은 슬라이드를 정리하거나, 백업한 뒤 오래된 필기를 지우세요. 가득 차면 새 필기가 저장되지 않습니다.</div>';
  if(st2) h+='<div class="np-warn">💾 '+alertHTML(st2)+' 위의 <b>백업 내보내기</b>를 누르세요.</div>';
  box.innerHTML=h; }
/* 틀이 노트 목록을 다시 그릴 때마다 함께 갱신 */
if(window.MutationObserver) new MutationObserver(notesBanner).observe(document.getElementById("npBody"),{childList:true});

/* 페이지가 바뀌면 낭독 */
var tabs=document.getElementById("tabs"); tabs.addEventListener("click",function(e){ var b=e.target.closest(".tab"); if(b) say((b.getAttribute("title")||b.textContent)+" 화면"); });
})();
