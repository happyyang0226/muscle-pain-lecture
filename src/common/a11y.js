/* 접근성 보강(모든 장 공통): 화면낭독기가 슬라이드 바뀜·퀴즈 선택·결과·알림을 읽도록 한 곳(#srLive)에 모아 알린다. */
(function(){
"use strict";
var live=document.createElement("div");
live.id="srLive"; live.setAttribute("aria-live","polite"); live.setAttribute("role","status");
live.style.cssText="position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0";
document.body.appendChild(live);
var t0=0;
function say(t){ if(!t) return; clearTimeout(t0); live.textContent=""; t0=setTimeout(function(){ live.textContent=t; },60); }
window.__srSay=say;
/* 슬라이드가 바뀌면 "슬라이드 5 / 36, 제목" */
var cnt=document.getElementById("count"), toc=document.getElementById("toc");
if(cnt&&window.MutationObserver){ new MutationObserver(function(){ var o=toc&&toc.options[toc.selectedIndex]; say("슬라이드 "+cnt.textContent.replace(/\s+/g," ").trim()+(o?", "+o.textContent.replace(/^\d+\.\s*/,""):"")); }).observe(cnt,{childList:true,characterData:true,subtree:true}); }
/* 퀴즈: 보기·확신도 선택, 결과 */
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("#quizIn .opt, #quizIn [data-conf]"); if(!b) return;
  setTimeout(function(){ var q=document.querySelector("#quizIn .qhead b");
    if(b.hasAttribute("data-opt")) say((q?q.textContent+", ":"")+"보기 "+(+b.getAttribute("data-opt")+1)+"번을 골랐습니다. 이제 확신도를 고르세요.");
    else say("확신도: "+b.textContent.trim()); },80);
},true);
var res=document.getElementById("resultIn");
if(res&&window.MutationObserver){ new MutationObserver(function(){ var h=res.querySelector("h2"); if(h) say("결과: "+h.textContent); }).observe(res,{childList:true}); }
/* 키보드로 다닐 때 초점 테두리를 분명하게 */
var st=document.createElement("style");
st.textContent=":focus-visible{outline:3px solid #1f5fa8!important;outline-offset:2px}";
document.head.appendChild(st);
})();
