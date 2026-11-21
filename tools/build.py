#!/usr/bin/env python3
"""src/ 원본을 합쳐 배포용 한 파일(dist/…html)을 만든다.

python3 tools/build.py            → dist/근육기원통증_웹앱.html
python3 tools/build.py --plain    → 압축하지 않은 판(디버깅용)

- 각 장(modules/*.html)은 gzip으로 압축해 base64로 넣는다(data-enc="gz").
  브라우저가 DecompressionStream으로 풀고, 없으면 내장 예비 해제기(tiny-inflate)로 푼다.
- 여러 장이 함께 쓰는 코드(common/*)는 한 번만 넣고, 장을 열 때 @@C:이름@@ 자리에 채운다.
- shell.html의 @@INCLUDE:경로@@ / @@RAW:경로@@ 는 src/ 기준 파일 내용으로 바뀐다.
"""
import base64, datetime, gzip, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
PLAIN = "--plain" in sys.argv
OUT = os.path.join(ROOT, "dist", "근육기원통증_웹앱" + ("_plain" if PLAIN else "") + ".html")

def read(p):
    return open(os.path.join(SRC, p), encoding="utf-8").read()

def expand(text, depth=0):
    if depth > 8:
        raise SystemExit("INCLUDE가 너무 깊게 겹쳤습니다")
    def inc(m):
        return expand(read(m.group(1)), depth + 1)
    text = re.sub(r"@@INCLUDE:([\w./-]+)@@", inc, text)
    text = re.sub(r"@@RAW:([\w./-]+)@@", lambda m: read(m.group(1)).strip(), text)
    text = re.sub(r"@@JSONSTR:([\w./-]+)@@", lambda m: json.dumps(read(m.group(1)), ensure_ascii=False).replace("</", "<\\/"), text)
    return text

def pack(text):
    raw = text.encode("utf-8")
    if PLAIN:
        return "b64", base64.b64encode(raw).decode()
    return "gz", base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode()

def script(id_, text):
    enc, b = pack(text)
    lines = "\n".join(b[i:i + 4096] for i in range(0, len(b), 4096))
    return f'<script type="application/octet-stream" id="{id_}" data-enc="{enc}">\n{lines}\n</script>\n'

order = json.load(open(os.path.join(SRC, "data", "module-order.json")))
common = {fn: read("common/" + fn) for fn in sorted(os.listdir(os.path.join(SRC, "common")))}

# 장 안의 @@C:이름@@ 이 모두 common에 있는지 확인
for k in order:
    for nm in re.findall(r"@@C:([\w.-]+)@@", read(f"modules/{k}.html")):
        if nm not in common:
            raise SystemExit(f"{k}: 공통 코드 '{nm}'이 src/common에 없습니다")

blob = "".join(script("m-" + k, read(f"modules/{k}.html")) for k in order)
blob += script("m-common", json.dumps(common, ensure_ascii=False))
# 틀이 쓰는 자료(문제은행·검색 색인·링크 목록·증례 등)도 압축해 넣는다: id="d-이름"
for fn in sorted(os.listdir(os.path.join(SRC, "data"))):
    if fn.endswith(".json") and fn not in ("module-order.json", "kmle-tags.json"):
        txt = read("data/" + fn)
        json.loads(txt)  # 형식 확인
        blob += script("d-" + fn[:-5], txt)

shell = expand(read("shell.html"))
stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
shell = shell.replace("@@BUILD@@", stamp)
left = re.findall(r"@@(?:INCLUDE|RAW|JSONSTR):[^@]*@@", shell)
if left:
    raise SystemExit("처리되지 않은 자리표시: " + ", ".join(left[:5]))
shell = shell.replace("@@MODULES@@", blob)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(shell)
print(f"{OUT}  {os.path.getsize(OUT)/1e6:.2f} MB  ({stamp})")
