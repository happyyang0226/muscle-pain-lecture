#!/usr/bin/env python3
"""링크 목록과 점검.

python3 tools/links.py            → src/data/links.json 다시 만들기(앱 안의 '영상 링크 점검'이 씀)
python3 tools/links.py --check    → 인터넷에 연결된 내 컴퓨터에서 모든 링크를 실제로 열어 보고
                                    dist/링크점검_날짜.csv · .html 보고서를 만든다(파이썬만 있으면 됨)

판정
  정상       : 열림(200번대, 다른 주소로 넘어가도 최종 200번대)
  확인 필요  : 403·429처럼 사이트가 자동 접속을 막은 경우(사람이 열면 열릴 수 있음)
  깨짐       : 404·410, 주소 없음, YouTube 영상 삭제·비공개
"""
import concurrent.futures as cf, csv, datetime, html as H, json, os, re, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
REVIEW = {"www.scribd.com": "무단 업로드 문서일 수 있음 → 원 출처(DOI·학술지)로 바꾸기 권장",
          "typeset.io": "논문 요약 사이트 → 원 논문 링크 권장", "test01.ku.dk": "시험용 서버 주소로 보임",
          "www.google.com": "검색 결과 링크 → 직접 주소 권장"}

def collect():
    order = json.load(open(os.path.join(SRC, "data", "module-order.json")))
    common = {f: open(os.path.join(SRC, "common", f), encoding="utf-8").read() for f in os.listdir(os.path.join(SRC, "common"))}
    titles = {}
    out = {}
    for k in order:
        t = open(os.path.join(SRC, "modules", k + ".html"), encoding="utf-8").read()
        t = re.sub(r"@@C:([\w.-]+)@@", lambda m: common[m.group(1)], t)
        titles[k] = (re.search(r"<title>([^<]*)", t) or [None, k])[1]
        # 슬라이드 단위로 나눠 어디에 쓰였는지 기록
        parts = re.split(r'(?=<section[^>]*class="[^"]*\bslide\b)', t)
        n = 0
        for part in parts:
            m = re.match(r'<section[^>]*class="[^"]*\bslide\b[^"]*"[^>]*', part)
            if m:
                n += 1
                tm = re.search(r'data-title="([^"]*)"', m.group(0))
                where = (n, H.unescape(tm.group(1)) if tm else f"슬라이드 {n}")
            else:
                where = (0, "공통·스크립트")
            for u in re.findall(r"https?://[^\s\"'<>\\)\]]+", part):
                u = H.unescape(u.rstrip(".,;"))
                if re.match(r"https?://(fonts\.(googleapis|gstatic)\.com|www\.w3\.org)", u):
                    continue
                rec = out.setdefault(u, {"u": u, "at": []})
                key = [k, where[0], where[1]]
                if key not in rec["at"]:
                    rec["at"].append(key)
    links = sorted(out.values(), key=lambda r: r["u"])
    for r in links:
        host = urllib.parse.urlparse(r["u"]).netloc
        yt = re.search(r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})", r["u"])
        if yt:
            r["yt"] = yt.group(1)
        if host in REVIEW:
            r["note"] = REVIEW[host]
    return links, titles

def check_one(r):
    UA = {"User-Agent": "Mozilla/5.0 (link check for a course web app)"}
    try:
        if r.get("yt"):
            q = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote("https://www.youtube.com/watch?v=" + r["yt"])
            try:
                urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=15)
                return "정상", "영상 있음"
            except urllib.error.HTTPError as e:
                if e.code == 401:
                    return "정상", "영상 있음(퍼가기 막힘)"
                return "깨짐", f"영상 삭제·비공개 ({e.code})"
        req = urllib.request.Request(r["u"], headers=UA, method="GET")
        with urllib.request.urlopen(req, timeout=20) as res:
            return "정상", f"{res.status}" + (f" → {res.url}" if res.url != r["u"] else "")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403, 405, 429, 503):
            return "확인 필요", f"{e.code} 자동 접속 막힘"
        return "깨짐", f"{e.code}"
    except Exception as e:
        return "깨짐", type(e).__name__ + ": " + str(e)[:80]

def main():
    links, titles = collect()
    json.dump({"titles": titles, "links": links}, open(os.path.join(SRC, "data", "links.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"links.json: 링크 {len(links)}개 (YouTube {sum(1 for r in links if r.get('yt'))}개, 검토 권장 {sum(1 for r in links if r.get('note'))}개)")
    if "--check" not in sys.argv:
        return
    print("모든 링크를 열어 보는 중… (몇 분 걸립니다)")
    with cf.ThreadPoolExecutor(12) as ex:
        res = list(ex.map(check_one, links))
    day = datetime.date.today().strftime("%Y%m%d")
    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    base = os.path.join(ROOT, "dist", f"링크점검_{day}")
    rows = []
    for r, (st, why) in zip(links, res):
        where = "; ".join(f"{titles.get(a[0], a[0]).split(' ')[0]} {a[1]}번 {a[2]}" for a in r["at"])
        rows.append([st, why, r.get("note", ""), r["u"], where])
    order = {"깨짐": 0, "확인 필요": 1, "정상": 2}
    rows.sort(key=lambda x: (order[x[0]], x[3]))
    with open(base + ".csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["판정", "이유", "검토 메모", "주소", "쓰인 곳"]); w.writerows(rows)
    cnt = {k: sum(1 for x in rows if x[0] == k) for k in order}
    body = "".join(f"<tr class='s{order[x[0]]}'><td>{x[0]}</td><td>{H.escape(x[1])}</td><td>{H.escape(x[2])}</td><td><a href='{H.escape(x[3])}' target='_blank'>{H.escape(x[3])}</a></td><td>{H.escape(x[4])}</td></tr>" for x in rows)
    open(base + ".html", "w", encoding="utf-8").write(f"""<!DOCTYPE html><meta charset=utf-8><title>링크 점검 {day}</title>
<style>body{{font-family:system-ui,'Noto Sans KR',sans-serif;margin:24px}}table{{border-collapse:collapse;width:100%;font-size:13px}}td,th{{border:1px solid #ddd;padding:5px 7px;vertical-align:top}}
.s0{{background:#fde8eb}}.s1{{background:#fff4d6}}a{{word-break:break-all}}</style>
<h1>링크 점검 · {day}</h1><p>깨짐 {cnt['깨짐']} · 확인 필요 {cnt['확인 필요']} · 정상 {cnt['정상']} (모두 {len(rows)}개)</p>
<table><tr><th>판정</th><th>이유</th><th>검토 메모</th><th>주소</th><th>쓰인 곳</th></tr>{body}</table>""")
    print(f"깨짐 {cnt['깨짐']} · 확인 필요 {cnt['확인 필요']} · 정상 {cnt['정상']}\n보고서: {base}.html")

if __name__ == "__main__":
    main()
