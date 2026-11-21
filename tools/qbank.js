#!/usr/bin/env node
(function(){
/* 각 장의 퀴즈(Q)를 꺼낸다. 장이 불러올 때 하는 정답 위치 재배치까지 마친 모양(학생 기록의 번호와 같은 순서)이다.
   node tools/qbank.js --dump   → 표준 출력으로 {mods:{장:{KEY,TYPES,Q}}}
   node tools/qbank.js          → src/data/qbank.json (복습·모의고사·결과 분석이 쓰는 문제은행) 다시 만들기
*/
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.dirname(__dirname), SRC = path.join(ROOT, "src");
const order = JSON.parse(fs.readFileSync(path.join(SRC, "data/module-order.json"), "utf8"));
const mods = {};
for (const k of order) {
  const t = fs.readFileSync(path.join(SRC, "modules", k + ".html"), "utf8");
  const b = [...t.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(x => x.includes("var Q=") && x.includes("QUIZ_META"));
  if (!b) continue;
  const s = b.indexOf("var TYPES"), e = b.indexOf("window.QUIZ_META");
  const ctx = { __o: null, Math, JSON }; vm.createContext(ctx);
  vm.runInContext(b.slice(s, e) + ";__o={TYPES:TYPES,Q:Q};", ctx);
  mods[k] = { KEY: b.match(/KEY="([^"]+)"/)[1], TYPES: ctx.__o.TYPES, Q: JSON.parse(JSON.stringify(ctx.__o.Q)) };
}
if (process.argv.includes("--dump")) { process.stdout.write(JSON.stringify({ mods }), () => process.exit(0)); return; }

/* 문제은행: 장별 문항 + 국시 영역 태그(data/kmle-tags.json) */
const tags = JSON.parse(fs.readFileSync(path.join(SRC, "data/kmle-tags.json"), "utf8"));
const bank = { v: 1, types: { mem: "암기형", int: "해석형", sol: "해결형", cas: "사례형" }, areas: tags.areas, mods: {} };
let n = 0, untagged = [];
const byStem = {};  /* 종합평가 문항이 장 문항과 같으면 그 장의 태그·출처를 물려받는다 */
for (const k of Object.keys(mods)) if (k !== "final") mods[k].Q.forEach((q, i) => { byStem[q.s] = k + "-" + (i + 1); });
for (const k of Object.keys(mods)) {
  bank.mods[k] = { key: mods[k].KEY, q: mods[k].Q.map((q, i) => {
    const id = k + "-" + (i + 1), same = k === "final" ? byStem[q.s] : null;
    const tg = tags.q[id] || (same && (tags.q[same] || tags.lo[same.split("-")[0] + ":" + mods[same.split("-")[0]].Q[+same.split("-")[1] - 1].lo])) || tags.lo[k + ":" + q.lo] || null;
    if (!tg) untagged.push(id);
    n++;
    return { id, same: same || undefined, t: q.t, lo: q.lo, s: q.s, o: q.o, a: q.a, w: q.w, c: q.c, area: tg, ev: q.ev || [], v: q.v || null };
  }) };
}
fs.writeFileSync(path.join(SRC, "data/qbank.json"), JSON.stringify(bank));
console.log("qbank.json:", n, "문항", untagged.length ? "· 태그 없음 " + untagged.length + "개: " + untagged.slice(0, 10).join(",") : "· 모든 문항 태그");
})();
