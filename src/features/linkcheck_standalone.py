#!/usr/bin/env python3
# 근육 기원 통증 웹앱 · 링크 점검 프로그램 (웹앱의 '링크 점검' 화면에서 내려받은 파일)
# 사용법: 인터넷에 연결된 컴퓨터에서  python 링크점검.py   (파이썬 3만 있으면 됩니다)
# 결과: 같은 폴더에 링크점검_날짜.html 과 .csv 가 생깁니다. 깨진 링크가 맨 위에 나옵니다.
import concurrent.futures as cf, csv, datetime, html as H, json, urllib.parse, urllib.request, urllib.error

DATA = json.loads(r'''__LINKS__''')
UA = {"User-Agent": "Mozilla/5.0 (link check for a course web app)"}

def check_one(r):
    try:
        if r.get("yt"):
            q = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote("https://www.youtube.com/watch?v=" + r["yt"])
            try:
                urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=15); return "정상", "영상 있음"
            except urllib.error.HTTPError as e:
                return ("정상", "영상 있음(퍼가기 막힘)") if e.code == 401 else ("깨짐", f"영상 삭제·비공개 ({e.code})")
        with urllib.request.urlopen(urllib.request.Request(r["u"], headers=UA), timeout=20) as res:
            return "정상", f"{res.status}" + (f" → {res.url}" if res.url != r["u"] else "")
    except urllib.error.HTTPError as e:
        return ("확인 필요", f"{e.code} 자동 접속 막힘") if e.code in (401, 403, 405, 429, 503) else ("깨짐", str(e.code))
    except Exception as e:
        return "깨짐", type(e).__name__ + ": " + str(e)[:80]

links, titles = DATA["links"], DATA["titles"]
print(f"링크 {len(links)}개를 열어 보는 중… 몇 분 걸립니다.")
with cf.ThreadPoolExecutor(12) as ex:
    res = list(ex.map(check_one, links))
order = {"깨짐": 0, "확인 필요": 1, "정상": 2}
rows = sorted(([st, why, r.get("note", ""), r["u"], "; ".join(f"{titles.get(a[0], a[0]).split(' ')[0]} {a[1]}번 {a[2]}" for a in r["at"])]
               for r, (st, why) in zip(links, res)), key=lambda x: (order[x[0]], x[3]))
day = datetime.date.today().strftime("%Y%m%d")
with open(f"링크점검_{day}.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f); w.writerow(["판정", "이유", "검토 메모", "주소", "쓰인 곳"]); w.writerows(rows)
cnt = {k: sum(1 for x in rows if x[0] == k) for k in order}
body = "".join(f"<tr class='s{order[x[0]]}'><td>{x[0]}</td><td>{H.escape(x[1])}</td><td>{H.escape(x[2])}</td><td><a href='{H.escape(x[3])}' target='_blank'>{H.escape(x[3])}</a></td><td>{H.escape(x[4])}</td></tr>" for x in rows)
open(f"링크점검_{day}.html", "w", encoding="utf-8").write(f"""<!DOCTYPE html><meta charset=utf-8><title>링크 점검 {day}</title>
<style>body{{font-family:system-ui,'Noto Sans KR',sans-serif;margin:24px}}table{{border-collapse:collapse;width:100%;font-size:13px}}td,th{{border:1px solid #ddd;padding:5px 7px;vertical-align:top}}.s0{{background:#fde8eb}}.s1{{background:#fff4d6}}a{{word-break:break-all}}</style>
<h1>링크 점검 · {day}</h1><p>깨짐 {cnt['깨짐']} · 확인 필요 {cnt['확인 필요']} · 정상 {cnt['정상']} (모두 {len(rows)}개)</p>
<table><tr><th>판정</th><th>이유</th><th>검토 메모</th><th>주소</th><th>쓰인 곳</th></tr>{body}</table>""")
print(f"깨짐 {cnt['깨짐']} · 확인 필요 {cnt['확인 필요']} · 정상 {cnt['정상']}  →  링크점검_{day}.html")
