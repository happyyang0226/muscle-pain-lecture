/* ===== 4단계: 결과 코드(학생) · 결과 분석(교수) — 서버 없이 =====
   학생: 📚 복습 → 결과 코드 — 제출한 장 퀴즈의 답·확신도를 이름 없이 짧은 글(코드)로 만든다.
   교수: 📊 결과 분석 — 코드를 여러 개 붙여 넣으면 문항별 정답률·오개념 비율·많이 고른 오답을 보여 준다.
   코드 형식: MPR1-<base64url(JSON)>-<검사 글자 4자리>
     JSON = {v:1, d:날짜(일 번호), g:반·조(선택), q:{장: "답확신답확신…"}} — 답 0~4, 확신 0~2, 안 푼 문항은 "-" */
(function(){
"use strict";
var esc=MP.esc, CONF=["확신","애매","모름"];
function b64u(s){ return MP.u8b64(new TextEncoder().encode(s)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function unb64u(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return new TextDecoder().decode(u); }
function sum4(s){ var h=7; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h.toString(36).slice(-4).toUpperCase(); }
function today(){ var d=new Date(); return Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/864e5); }

/* ---------- 학생: 코드 만들기 ---------- */
function makeCode(bank,group){ var q={}, n=0;
  Object.keys(bank.raw.mods).forEach(function(m){ var md=bank.raw.mods[m], st=null; try{ st=JSON.parse(localStorage.getItem(md.key)||"null"); }catch(e){}
    if(!st||!st.done||!st.ans) return; var s="";
    md.q.forEach(function(_,k){ var a=st.ans[k], c=st.conf[k]; s+=(a==null?"-":String(a))+(c==null?"-":String(c)); }); q[m]=s; n++; });
  if(!n) return null;
  var body=b64u(JSON.stringify({v:1,d:today(),g:(group||"").slice(0,20),q:q}));
  return {code:"MPR1-"+body+"-"+sum4(body),n:n}; }
MP.study=MP.study||{};
MP.study.drawCode=function(box,bank){ var g=""; try{ g=localStorage.getItem("mp-group")||""; }catch(e){}
  var h='<div class="panel info" style="margin-top:0"><b>결과 코드</b>는 제출한 장 퀴즈의 답과 확신도를 <b>이름 없이</b> 짧은 글로 바꾼 것입니다. 교수님이 알려 준 곳(과제 게시판·설문 등)에 붙여 넣으면, 교수님은 반 전체의 문항별 정답률과 오개념을 볼 수 있습니다. 이름·학번은 들어가지 않습니다.</div>';
  h+='<div class="field" style="max-width:320px"><label for="cdG">반·조 (선택, 교수님이 정해 준 경우만)</label><input id="cdG" maxlength="20" placeholder="예: 2-A" value="'+esc(g)+'"></div><div class="row"><button class="btn primary" id="cdMake">결과 코드 만들기</button></div><div id="cdOut"></div>';
  box.innerHTML=h;
  box.querySelector("#cdMake").onclick=function(){ var gv=box.querySelector("#cdG").value.trim(); try{ localStorage.setItem("mp-group",gv); }catch(e){}
    var r=makeCode(bank,gv), out=box.querySelector("#cdOut");
    if(!r){ out.innerHTML='<div class="panel warn">아직 제출한 장 퀴즈가 없습니다. 각 장 끝의 퀴즈를 모두 풀고 <b>제출</b>한 뒤 다시 누르세요.</div>'; return; }
    out.innerHTML='<p class="small muted">퀴즈 '+r.n+'개 장의 결과가 들어 있습니다. 아래 글 전체를 복사해 보내세요.</p><textarea class="code" id="cdTxt" readonly>'+esc(r.code)+'</textarea><div class="row"><button class="btn" id="cdCopy">복사</button><button class="btn" id="cdSave">파일로 저장(.txt)</button><span id="cdMsg" class="small muted" aria-live="polite"></span></div>';
    var ta=out.querySelector("#cdTxt"); ta.focus(); ta.select();
    out.querySelector("#cdCopy").onclick=function(){ ta.select(); var ok=false; try{ ok=document.execCommand("copy"); }catch(e){} if(navigator.clipboard) navigator.clipboard.writeText(r.code).then(function(){ msg("복사했습니다"); },function(){ msg(ok?"복사했습니다":"글을 길게 눌러 직접 복사하세요"); }); else msg(ok?"복사했습니다":"글을 선택해 직접 복사하세요"); };
    out.querySelector("#cdSave").onclick=function(){ MP.download("퀴즈결과코드_"+MP.stamp()+".txt",r.code,"text/plain"); };
    function msg(t){ out.querySelector("#cdMsg").textContent=t; } }; };

/* ---------- 교수: 결과 분석 ---------- */
function parse(text){ var codes=(text.match(/MPR1-[A-Za-z0-9_-]+-[0-9A-Z]{1,4}/g)||[]), seen={}, ok=[], bad=0, dup=0;
  codes.forEach(function(c){ var p=c.split("-"), body=p.slice(1,-1).join("-"), cs=p[p.length-1];
    if(sum4(body)!==cs){ bad++; return; } if(seen[c]){ dup++; return; } seen[c]=1;
    try{ var o=JSON.parse(unb64u(body)); if(o&&o.v===1&&o.q) ok.push(o); else bad++; }catch(e){ bad++; } });
  return {list:ok,bad:bad,dup:dup,found:codes.length}; }
var RAW="", GROUP="";
function render(el){ el.innerHTML='<div class="wrap"><p class="muted">문제은행을 불러오는 중…</p></div>';
  MP.study.ready().then(function(bank){
    var h='<div class="wrap"><div class="pg-head"><div><h1>📊 결과 분석</h1><p class="lead">학생들이 <b>📚 복습 → 결과 코드</b>에서 만든 코드를 아래에 붙여 넣거나(여러 개를 한꺼번에, 줄바꿈·공백 상관없음), 받은 .txt 파일을 여러 개 고르세요. 서버 없이 이 컴퓨터에서만 계산합니다.</p></div><button class="btn" data-home="1">← 처음 화면</button></div>';
    h+='<textarea class="code" id="anIn" placeholder="MPR1-… 코드를 붙여 넣으세요">'+esc(RAW)+'</textarea><div class="row" style="margin-top:6px"><button class="btn primary" id="anGo">분석</button><label class="btn">파일 고르기(.txt 여러 개)<input type="file" id="anFile" accept=".txt,text/plain" multiple hidden></label><button class="btn" id="anDemo" title="화면 확인용 가짜 자료 30명">예시 자료로 보기</button><span id="anMsg" class="small muted" aria-live="polite"></span></div><div id="anOut"></div></div>';
    el.innerHTML=h;
    var inp=el.querySelector("#anIn");
    el.querySelector("#anGo").onclick=function(){ RAW=inp.value; analyze(el,bank); };
    el.querySelector("#anFile").onchange=function(){ var fs=[].slice.call(this.files||[]), n=0, buf=[]; if(!fs.length) return;
      fs.forEach(function(f){ var r=new FileReader(); r.onload=function(){ buf.push(r.result); if(++n===fs.length){ inp.value=(inp.value?inp.value+"\n":"")+buf.join("\n"); RAW=inp.value; analyze(el,bank); } }; r.readAsText(f); }); this.value=""; };
    el.querySelector("#anDemo").onclick=function(){ inp.value=demo(bank); RAW=inp.value; analyze(el,bank); };
    if(RAW) analyze(el,bank); }); }
function demo(bank){ var out=[]; for(var s=0;s<30;s++){ var q={}; Object.keys(bank.raw.mods).forEach(function(m){ if(Math.random()<.25) return; var str="";
      bank.raw.mods[m].q.forEach(function(qq,k){ var skill=.55+((k*7+s*3)%10)/25, ok=Math.random()<skill, a=ok?qq.a:(qq.a+1+((k+s)%3===0?0:Math.floor(Math.random()*4)))%5, c=ok?(Math.random()<.7?0:1):(k%4===0?0:(Math.random()<.5?1:2)); str+=a+""+c; }); q[m]=str; });
    var body=b64u(JSON.stringify({v:1,d:today(),g:s<15?"A반":"B반",q:q})); out.push("MPR1-"+body+"-"+sum4(body)); } return out.join("\n"); }
function analyze(el,bank){ var P=parse(RAW), msg=el.querySelector("#anMsg"), out=el.querySelector("#anOut");
  msg.textContent="코드 "+P.found+"개 · 사용 "+P.list.length+"개"+(P.dup?" · 중복 "+P.dup:"")+(P.bad?" · 손상·형식 오류 "+P.bad:"");
  if(!P.list.length){ out.innerHTML='<div class="panel warn">분석할 수 있는 코드가 없습니다. MPR1-로 시작하는 코드 전체를 붙여 넣었는지 확인하세요.</div>'; return; }
  var groups={}; P.list.forEach(function(o){ if(o.g) groups[o.g]=1; }); var G=Object.keys(groups).sort();
  var L=P.list.filter(function(o){ return !GROUP||o.g===GROUP; });
  /* 집계 */ var A={}, byArea={}, chap={};
  Object.keys(bank.raw.mods).forEach(function(m){ var md=bank.raw.mods[m];
    md.q.forEach(function(q,k){ var r={m:m,k:k,q:q,n:0,ok:0,mis:0,unl:0,uns:0,mas:0,pick:[0,0,0,0,0],conf:[0,0,0]};
      L.forEach(function(o){ var s=o.q[m]; if(!s) return; var a=s.charAt(k*2), c=s.charAt(k*2+1); if(a==="-"||a==="") return; a=+a; c=c==="-"?1:+c;
        r.n++; r.pick[a]=(r.pick[a]||0)+1; r.conf[c]++; var ok=a===q.a; if(ok) r.ok++; r[MP.study.cat(ok,c)]++; });
      if(r.n){ A[m+"-"+k]=r; var ar=q.area||"?"; byArea[ar]=byArea[ar]||[0,0,0]; byArea[ar][0]+=r.ok; byArea[ar][1]+=r.n; byArea[ar][2]+=r.mis;
        chap[m]=chap[m]||{ok:0,n:0,mis:0,students:0}; chap[m].ok+=r.ok; chap[m].n+=r.n; chap[m].mis+=r.mis; } });
    if(chap[m]) chap[m].students=L.filter(function(o){ return o.q[m]; }).length; });
  var rows=Object.keys(A).map(function(k){ return A[k]; });
  var h='<div class="kpis" style="margin-top:14px"><div class="kpi"><b>'+L.length+'</b><span>학생(코드)</span></div><div class="kpi"><b>'+Object.keys(chap).length+'</b><span>결과가 있는 장</span></div><div class="kpi"><b>'+rows.reduce(function(a,r){ return a+r.n; },0)+'</b><span>모은 답</span></div></div>';
  if(G.length) h+='<div class="row"><span class="small muted">반·조</span><div class="seg" id="anG"><button type="button" data-g="" aria-pressed="'+(!GROUP)+'">전체</button>'+G.map(function(g){ return '<button type="button" data-g="'+esc(g)+'" aria-pressed="'+(GROUP===g)+'">'+esc(g)+'</button>'; }).join("")+'</div></div>';
  h+='<h2>장별</h2><div class="tbwrap"><table class="tb"><tr><th>장</th><th class="num">학생</th><th class="num">평균 정답률</th><th class="num">오개념 비율</th></tr>'+Object.keys(chap).map(function(m){ var c=chap[m]; return '<tr><td>'+esc(MP.T[m])+'</td><td class="num">'+c.students+'</td><td class="num">'+pct(c.ok,c.n)+'</td><td class="num">'+pct(c.mis,c.n)+'</td></tr>'; }).join("")+'</table></div>';
  h+='<h2>국시 영역별</h2><div class="tbwrap"><table class="tb"><tr><th>영역</th><th class="num">정답률</th><th class="num">오개념 비율</th></tr>'+Object.keys(bank.areas).filter(function(a){ return byArea[a]; }).map(function(a){ var x=byArea[a], A2=bank.areas[a]; return '<tr><td>'+esc(A2.s.replace("물리치료 ","")+" · "+A2.n)+'</td><td class="num">'+pct(x[0],x[1])+'</td><td class="num">'+pct(x[2],x[1])+'</td></tr>'; }).join("")+'</table></div>';
  var top=rows.filter(function(r){ return r.n>=3; }).sort(function(a,b){ return b.mis/b.n-a.mis/a.n||a.ok/a.n-b.ok/b.n; }).slice(0,15);
  h+='<h2>다시 가르칠 문항 (오개념 비율 높은 순, 응답 3명 이상)</h2><p class="small muted">오개념 = 확신한다고 답했는데 틀림. 많이 고른 오답이 곧 학생들이 가진 잘못된 생각입니다.</p>'+top.map(function(r){ var wi=-1, wn=0; r.pick.forEach(function(c,i){ if(i!==r.q.a&&c>wn){ wn=c; wi=i; } });
    return '<div class="qcard"><div class="meta"><span class="tag">'+esc(MP.T[r.m].split(" ")[0])+' '+(r.k+1)+'번 · '+esc(r.q.lo)+'</span><span class="tag red">오개념 '+pct(r.mis,r.n)+'</span><span class="tag green">정답률 '+pct(r.ok,r.n)+'</span><span class="tag">응답 '+r.n+'</span></div><p class="qstem" style="font-size:.95rem">'+esc(r.q.s)+'</p>'+
      r.q.o.map(function(o,i){ var w=r.n?Math.round(r.pick[i]/r.n*100):0; return '<div class="row small" style="flex-wrap:nowrap"><span style="width:52%;'+(i===r.q.a?"font-weight:700;color:#1f8a4c":"")+'">'+(i===r.q.a?"✓ ":"")+esc(o)+'</span><div class="bar" style="flex:1"><i style="width:'+w+'%;background:'+(i===r.q.a?"#1f8a4c":(i===wi?"#b4233c":"#9aa5b5"))+'"></i></div><span class="num" style="width:40px;text-align:right">'+w+'%</span></div>'; }).join("")+
      (wi>=0&&wn?'<p class="small" style="margin:6px 0 0">가장 많이 고른 오답: <b>'+esc(r.q.o[wi])+'</b>'+(r.q.w&&r.q.w[wi]?' — '+esc(r.q.w[wi]):'')+'</p>':'')+'</div>'; }).join("");
  h+='<div class="qnav"><button class="btn" id="anCsv">⬇ 문항별 전체 표(.csv)</button><button class="btn" id="anPrint">인쇄 / PDF</button></div>';
  out.innerHTML=h;
  var seg=out.querySelector("#anG"); if(seg) seg.onclick=function(e){ var b=e.target.closest("[data-g]"); if(!b) return; GROUP=b.getAttribute("data-g"); analyze(el,bank); };
  out.querySelector("#anPrint").onclick=function(){ window.print(); };
  out.querySelector("#anCsv").onclick=function(){ var head=["장","번호","학습목표","유형","국시 영역","문항","응답","정답률","오개념","모름","운 좋게 맞힘","숙달","①","②","③","④","⑤","정답"];
    var lines=[head].concat(rows.map(function(r){ var ar=bank.areas[r.q.area]||{n:""}; return [MP.T[r.m],r.k+1,r.q.lo,bank.types[r.q.t]||r.q.t,ar.n,r.q.s,r.n,pct(r.ok,r.n),pct(r.mis,r.n),pct(r.unl,r.n),pct(r.uns,r.n),pct(r.mas,r.n)].concat(r.pick.map(function(c){ return pct(c,r.n); })).concat([["①","②","③","④","⑤"][r.q.a]]); }));
    MP.download("퀴즈결과분석_"+MP.stamp()+".csv","﻿"+lines.map(function(l){ return l.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(","); }).join("\r\n"),"text/csv"); }; }
function pct(a,b){ return b?Math.round(a/b*100)+"%":"-"; }
var el=MP.page("analysis","결과 분석",render);
el.addEventListener("click",function(e){ if(e.target.closest("[data-home]")) MP.show("home"); });
MP.analysis={parse:parse,makeCode:makeCode};
})();
