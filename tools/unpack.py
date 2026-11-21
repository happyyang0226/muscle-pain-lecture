#!/usr/bin/env python3
"""원본 한 파일 웹앱(.html)을 고치기 쉬운 원본 폴더(src/)로 풀어 놓는다. 처음 한 번만 쓴다.

python3 tools/unpack.py 원본.html src/

- src/shell.html        : 바깥 틀(탭·홈·내 노트·교수 수정). 스크립트는 shell.js로 분리
- src/shell.js          : 틀 스크립트. 과정 전체 검색 색인은 data/course-index.json으로 분리
- src/modules/<k>.html  : 각 장. 여러 장이 똑같이 쓰는 코드는 @@C:이름@@ 자리표시로 바뀜
- src/common/<이름>     : 공통 코드(한 곳만 고치면 모든 장에 반영)
"""
import base64, hashlib, json, os, re, sys
from collections import defaultdict

src, out = sys.argv[1], sys.argv[2]
html = open(src, encoding="utf-8").read()
for d in ("modules", "common", "data"):
    os.makedirs(os.path.join(out, d), exist_ok=True)

MOD_RE = re.compile(r'<script type="application/octet-stream" id="m-(\w+)">\s*([A-Za-z0-9+/=\s]+?)\s*</script>\s*')
mods = {k: base64.b64decode(b).decode("utf-8") for k, b in MOD_RE.findall(html)}
order = [k for k, _ in MOD_RE.findall(html)]

# 1) 공통 블록 찾기: 두 장 이상에 글자 하나 다르지 않게 들어 있는 <script>/<style> 내용
BLOCK_RE = re.compile(r'(<(script|style)\b[^>]*>)(.*?)(</\2>)', re.S)
seen = defaultdict(set)
for k, t in mods.items():
    for m in BLOCK_RE.finditer(t):
        body = m.group(3)
        if len(body) > 300:
            seen[hashlib.md5(body.encode()).hexdigest()].add(k)

NAMES = {  # 알아보기 쉬운 이름(내용의 첫머리로 판단)
    "해부학 인체 도해": "anat.js", 'id="lkData"': "glossary.json", "STUDY_CFG||{}": "edit.js",
    "mp-notes-v1": "notes.js", "JOSA=": "lookup.js", "claude\\.ai\\/artifact": "links.js",
    "myVidBtn": "xtools.js", "db.collection": "xtools.js",
}
common, used = {}, set()
def name_for(tag, body, kind):
    for key, nm in NAMES.items():
        if key in body or key in tag:
            base = nm
            break
    else:
        base = "block." + ("css" if kind == "style" else "js")
    stem, ext = base.rsplit(".", 1)
    n, i = base, 2
    while n in used:
        n = f"{stem}{i}.{ext}"; i += 1
    used.add(n)
    return n

hash2name = {}
for k in order:
    def sub(m):
        tag, kind, body, end = m.groups()[0], m.group(2), m.group(3), m.group(4)
        h = hashlib.md5(body.encode()).hexdigest()
        if len(body) > 300 and len(seen[h]) >= 2:
            if h not in hash2name:
                nm = name_for(tag, body, kind)
                if kind == "style" and not nm.endswith(".css"):
                    nm = nm.rsplit(".", 1)[0] + ".css"
                hash2name[h] = nm
                common[nm] = body
            return f"{tag}@@C:{hash2name[h]}@@{end}"
        return m.group(0)
    mods[k] = BLOCK_RE.sub(sub, mods[k])
    open(os.path.join(out, "modules", k + ".html"), "w", encoding="utf-8").write(mods[k])
for nm, body in common.items():
    open(os.path.join(out, "common", nm), "w", encoding="utf-8").write(body)

# 2) 틀(shell): 모듈 자리 → @@MODULES@@, 스크립트 → shell.js, 색인 → JSON
shell = MOD_RE.sub("", html, count=0)
first = html.find('<script type="application/octet-stream"')
shell = html[:first] + "@@MODULES@@\n" + MOD_RE.sub("", html[first:])
m = re.search(r"<script>\n(\(function\(\)\{.*?)</script>", shell, re.S)
js = m.group(1)
shell = shell[:m.start()] + "<script>\n@@INCLUDE:shell.js@@\n</script>" + shell[m.end():]
im = re.search(r"var COURSE_IDX_ALL=(\[.*?\}\]);", js, re.S)
open(os.path.join(out, "data", "course-index.json"), "w", encoding="utf-8").write(im.group(1))
js = js[:im.start()] + "var COURSE_IDX_ALL=@@RAW:data/course-index.json@@;" + js[im.end():]
open(os.path.join(out, "shell.html"), "w", encoding="utf-8").write(shell)
open(os.path.join(out, "shell.js"), "w", encoding="utf-8").write(js)
json.dump(order, open(os.path.join(out, "data", "module-order.json"), "w"))
print("modules:", order)
print("common:", {k: len(v) for k, v in common.items()})
