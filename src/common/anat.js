/* 해부학 인체 도해: 피부 실루엣 위에 근육을 겹쳐 그리는 SVG 생성기
   ANAT.body({view:"back"|"front", hl:[근육키], dim:true, deep:[근육키], ref:[[x,y,rx,ry]], dots:[[x,y,"라벨",dx,dy]], w:...}) */
(function(g){
"use strict";
var W=300;
function mx(p){return [W-p[0],p[1]];}
function smooth(pts,closed){
  var n=pts.length, d="M"+pts[0][0]+" "+pts[0][1];
  var get=function(i){ if(closed) return pts[(i+n)%n]; return pts[Math.max(0,Math.min(n-1,i))]; };
  var last=closed?n:n-1;
  for(var i=0;i<last;i++){
    var p0=get(i-1),p1=get(i),p2=get(i+1),p3=get(i+2);
    var c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6];
    var c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
    d+=" C"+c1[0].toFixed(1)+" "+c1[1].toFixed(1)+" "+c2[0].toFixed(1)+" "+c2[1].toFixed(1)+" "+p2[0]+" "+p2[1];
  }
  return d+(closed?" Z":"");
}
/* 몸 외곽(왼쪽 절반, 위 중앙 → 아래 중앙) */
var OUT=[[150,84],[140,86],[136,98],[118,108],[98,114],[82,124],[74,142],[71,170],[68,205],[64,245],[60,285],[57,320],[56,342],[52,365],[56,388],[66,392],[72,368],[76,345],[80,320],[86,282],[92,245],[96,205],[100,180],[102,215],[104,255],[100,290],[96,325],[96,360],[100,405],[104,445],[100,480],[104,520],[110,560],[104,580],[100,592],[132,594],[136,578],[136,540],[138,500],[136,455],[140,410],[144,370],[150,352]];
function outline(){
  var l=OUT.slice(), r=OUT.slice().reverse().map(mx);
  return smooth(l.concat(r.slice(1,-1)),true);
}
/* 근육: 왼쪽 절반 좌표. mid:true면 중앙선에 붙은 근육(대칭 합성) */
var M={back:{
  trapezius_u:{n:"위등세모근",p:[[150,76],[144,82],[138,94],[124,104],[106,112],[96,118],[106,126],[128,126],[150,124]],mid:1},
  trapezius_ml:{n:"중간·아래등세모근",p:[[150,122],[130,124],[112,126],[124,138],[136,160],[142,190],[150,236]],mid:1},
  levator:{n:"어깨올림근",p:[[141,84],[137,86],[126,110],[121,122],[127,124],[134,108],[143,90]]},
  deltoid:{n:"어깨세모근",p:[[106,116],[92,118],[80,128],[75,146],[78,168],[86,178],[94,160],[102,140],[110,126]]},
  infraspinatus:{n:"가시아래근",p:[[112,136],[138,140],[134,160],[126,186],[116,172],[108,150]]},
  latissimus:{n:"넓은등근",p:[[124,186],[142,192],[150,240],[150,292],[126,288],[106,272],[100,230],[100,198],[110,180]],mid:0},
  erector:{n:"척주세움근",p:[[150,170],[142,172],[138,220],[138,280],[140,322],[150,326]],mid:1},
  ql:{n:"허리네모근",p:[[132,268],[146,268],[146,302],[124,304],[120,290]]},
  tlf:{n:"등허리근막",p:[[150,262],[120,268],[110,290],[118,312],[150,318]],mid:1},
  gmed:{n:"중간볼기근",p:[[102,298],[130,294],[134,312],[122,326],[100,334],[97,316]]},
  gmax:{n:"큰볼기근",p:[[100,334],[124,322],[142,326],[150,334],[150,372],[132,382],[108,378],[98,356]]},
  piriformis:{n:"궁둥구멍근",p:[[146,330],[124,334],[104,340],[104,348],[124,344],[146,340]]},
  hamstrings:{n:"뒤넙다리근",p:[[106,378],[130,384],[144,376],[142,420],[138,450],[124,456],[112,450],[104,420]]},
  gastroc:{n:"장딴지근",p:[[106,460],[124,456],[140,462],[140,490],[134,520],[122,530],[110,520],[104,490]]},
  soleus:{n:"가자미근",p:[[108,520],[122,532],[136,522],[134,550],[124,566],[112,552]]},
  wrist_ext:{n:"손목·손가락 폄근",p:[[64,248],[80,250],[86,262],[80,300],[72,328],[62,326],[60,290]]}
},front:{
  scm:{n:"목빗근",p:[[138,70],[142,72],[148,112],[144,114]]},
  trap_f:{n:"위등세모근",p:[[140,90],[136,98],[118,108],[106,114],[120,110],[140,100]]},
  pec:{n:"큰가슴근",p:[[150,118],[132,116],[110,120],[98,132],[104,150],[118,164],[150,166]],mid:1},
  deltoid:{n:"어깨세모근",p:[[112,116],[94,118],[80,128],[75,146],[78,168],[86,176],[96,158],[104,136]]},
  biceps:{n:"위팔두갈래근",p:[[80,170],[94,166],[96,190],[92,228],[84,240],[76,228],[74,200]]},
  forearm_f:{n:"아래팔 굽힘근",p:[[70,248],[90,250],[92,262],[86,300],[76,330],[64,326],[64,290]]},
  rectus:{n:"배곧은근",p:[[150,172],[134,172],[132,220],[134,270],[138,300],[150,304]],mid:1},
  oblique:{n:"배바깥빗근",p:[[132,172],[106,180],[100,220],[104,262],[118,286],[134,270],[132,220]]},
  iliopsoas:{n:"엉덩허리근",p:[[136,280],[124,300],[124,336],[132,348],[140,330],[142,296]]},
  quads:{n:"넙다리네갈래근",p:[[102,336],[124,344],[140,360],[140,410],[134,444],[120,452],[108,446],[100,410],[98,370]]},
  tib_ant:{n:"앞정강근",p:[[110,466],[122,464],[126,490],[122,540],[116,566],[110,560],[108,520],[106,490]]}
}};
function musclePath(m){
  if(m.mid){ var l=m.p, r=m.p.slice().reverse().map(mx); return smooth(l.concat(r.slice(1,-1)),true); }
  return smooth(m.p,true)+" "+smooth(m.p.map(mx),true);
}
var uid=0;
function body(o){
  o=o||{}; var view=o.view||"back", set=M[view], hl=o.hl||[], deep=o.deep||[], id="a"+(++uid);
  var vb=o.viewBox||"-90 0 480 605";
  var s='<svg class="fig anat" viewBox="'+vb+'" role="img" aria-label="'+(o.label||"인체 해부 도해")+'" xmlns="http://www.w3.org/2000/svg">';
  s+='<defs>'+
   '<linearGradient id="'+id+'sk" x1="0" x2="1"><stop offset="0" stop-color="#d9a98c"/><stop offset=".5" stop-color="#f1cfb7"/><stop offset="1" stop-color="#d4a083"/></linearGradient>'+
   '<radialGradient id="'+id+'mu" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#e2475f"/><stop offset=".6" stop-color="#b4233c"/><stop offset="1" stop-color="#6e1022"/></radialGradient>'+
   '<radialGradient id="'+id+'md" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#e9b3b0"/><stop offset="1" stop-color="#c98a88"/></radialGradient>'+
   '<pattern id="'+id+'fb" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate('+(o.fiber||70)+')"><line x1="0" y1="0" x2="0" y2="5" stroke="#000" stroke-opacity=".18" stroke-width="1"/></pattern>'+
   '<radialGradient id="'+id+'rf"><stop offset="0" stop-color="#ff2d55" stop-opacity=".75"/><stop offset=".55" stop-color="#ff2d55" stop-opacity=".35"/><stop offset="1" stop-color="#ff2d55" stop-opacity="0"/></radialGradient>'+
   '<filter id="'+id+'sh" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="2" dy="3"/><feComponentTransfer><feFuncA type="linear" slope=".25"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
   '</defs>';
  s+='<g filter="url(#'+id+'sh)"><ellipse cx="150" cy="48" rx="27" ry="34" fill="url(#'+id+'sk)" stroke="#a87358" stroke-width="1"/>';
  s+='<path d="'+outline()+'" fill="url(#'+id+'sk)" stroke="#a87358" stroke-width="1.2"/></g>';
  if(view==="back"){ s+='<path d="M150 90 V330" stroke="#a87358" stroke-opacity=".5" stroke-width="1"/>'; }
  else { s+='<path d="M150 112 V300" stroke="#a87358" stroke-opacity=".35" stroke-width="1"/><circle cx="150" cy="248" r="2" fill="#a87358"/>'; }
  var keys=Object.keys(set);
  keys.forEach(function(k){
    if(k==="tlf") return;
    var on=hl.indexOf(k)>=0, isDeep=deep.indexOf(k)>=0;
    if(!on && o.dim===false) return;
    if(isDeep&&!on) return;
    var d=musclePath(set[k]);
    s+='<path d="'+d+'" fill="url(#'+id+(on?'mu':'md')+')" fill-opacity="'+(on?1:.55)+'" stroke="'+(on?'#5a0c1b':'#b67a78')+'" stroke-width="'+(on?1.2:.6)+'"'+(isDeep?' stroke-dasharray="4 3"':'')+'/>';
    s+='<path d="'+d+'" fill="url(#'+id+'fb)" fill-opacity="'+(on?1:.5)+'"/>';
  });
  if(hl.indexOf("tlf")>=0){
    s+='<path d="'+musclePath(set.tlf)+'" fill="#f4f0e6" fill-opacity=".85" stroke="#9c8f6a" stroke-width="1.2"/>';
    s+='<path d="'+musclePath(set.tlf)+'" fill="url(#'+id+'fb)" fill-opacity=".6"/>';
  }
  if(view==="back"&&o.scapula!==false){
    s+='<path d="'+smooth([[110,128],[140,132],[134,160],[128,190],[114,160]],true)+" "+smooth([[110,128],[140,132],[134,160],[128,190],[114,160]].map(mx),true)+'" fill="none" stroke="#f7efe6" stroke-opacity=".9" stroke-width="1.4"/>';
    s+='<path d="M110 136 L140 134 M190 134 L160 136" stroke="#f7efe6" stroke-width="2" stroke-opacity=".9"/>';
  }
  (o.ref||[]).forEach(function(r){ s+='<ellipse cx="'+r[0]+'" cy="'+r[1]+'" rx="'+r[2]+'" ry="'+r[3]+'" fill="url(#'+id+'rf)"/>';
    for(var i=0;i<14;i++){var a=i*2.39996,rr=Math.sqrt(i/14);s+='<circle cx="'+(r[0]+Math.cos(a)*rr*r[2]*.8).toFixed(1)+'" cy="'+(r[1]+Math.sin(a)*rr*r[3]*.8).toFixed(1)+'" r="1.6" fill="#c0002a" fill-opacity=".8"/>';} });
  (o.marks||[]).forEach(function(m){ s+='<g><circle cx="'+m[0]+'" cy="'+m[1]+'" r="6" fill="#fff" stroke="#111" stroke-width="2"/><path d="M'+(m[0]-3)+' '+m[1]+' h6 M'+m[0]+' '+(m[1]-3)+' v6" stroke="#111" stroke-width="1.6"/></g>'; });
  (o.labels||[]).forEach(function(L){
    var x=L[0],y=L[1],tx=L[3],ty=L[4],left=tx<x,fs=(L[5]||13);
    s+='<polyline points="'+x+','+y+' '+(left?tx+40:tx-40)+','+ty+' '+tx+','+ty+'" fill="none" stroke="var(--ink,#172033)" stroke-width="1"/><circle cx="'+x+'" cy="'+y+'" r="2.4" fill="var(--ink,#172033)"/>';
    s+='<text x="'+tx+'" y="'+(ty-5)+'" font-size="'+fs+'" font-weight="700" text-anchor="'+(left?'start':'end')+'" fill="var(--ink,#172033)" style="paint-order:stroke;stroke:var(--paper,#fff);stroke-width:3px">'+L[2]+'</text>';
  });
  if(o.caption) s+='<text x="150" y="'+(parseInt(vb.split(" ")[1])+parseInt(vb.split(" ")[3])-6)+'" text-anchor="middle" font-size="12" fill="var(--muted,#5a6578)">'+o.caption+'</text>';
  return s+'</svg>';
}
g.ANAT={body:body,names:M};
function fill(){ [].forEach.call(document.querySelectorAll("[data-anat]"),function(el){ try{ el.outerHTML=body(JSON.parse(el.getAttribute("data-anat"))); }catch(e){ el.textContent="도해를 그리지 못했습니다."; } }); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",fill); else fill();
})(window);
