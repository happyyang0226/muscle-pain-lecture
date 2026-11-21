# 근육 기원 통증 · 통합 웹앱

근거기반 근육 기원 통증 강의(1–8장, 종합)와 '통증 원인 찾기' 도구를 한 파일에 묶은 웹앱입니다.

- `index.html` 하나로 동작합니다(약 0.9MB). 인터넷 없이 파일을 바로 열어도 됩니다.
- GitHub Pages: Settings → Pages → Branch `main` / `/ (root)` → Save
  → `https://happyyang0226.github.io/muscle-pain-lecture/`

## 구성
- 상단 탭: 1장–8장, 종합, 통증 원인 찾기, 📚 복습, 🩺 증례, ✍ 내 노트
- 각 장: 학습목표·인포그래픽·강의 슬라이드·퀴즈(확신도 표시·오답 심화), 필기(펜·형광펜·도형·🔤 글자)·용어 찾기
- 통증 원인 찾기: 앞·뒤 몸 그림에 아픈 곳을 찍으면 후보 근육과 연관통 지도(되돌리기 지원)
  - 🎯 역방향 퀴즈: 근육 → 연관통 부위 찍기 / 연관통 → 근육 맞히기
  - 근육마다 그 근육이 나오는 강의안 슬라이드 바로가기
- 📚 복습: 오늘의 복습(간격 반복 1→3→7→14→30일) · 오개념 노트(확신도 4분면) · 국시 모의고사(영역 층화) · 결과 코드
- 🩺 증례: 문진 → 적신호 → 기전 추론 → 촉진·원인 근육 → 중재 → 재평가를 고르는 증례 4개
- 교수용(처음 화면 아래): 내용 수정·수정본 저장, ✎ 퀴즈 편집, 📊 결과 분석(학생 결과 코드 모아 보기), 🔗 링크 점검
- 백업: ✍ 내 노트 → 백업 내보내기(필기·퀴즈·복습 기록 모두). 오래 백업하지 않으면 처음 화면에 알림

## 고치는 방법(원본)
`index.html`은 `src/`를 합쳐 만든 결과물입니다. 내용을 고칠 때는 `src/`를 고치고 다시 만듭니다.

```
src/shell.html, shell.js   바깥 틀
src/features/              복습·증례·분석·퀴즈 편집·링크 점검·백업 알림
src/modules/<장>.html      각 장(공통 코드 자리는 @@C:이름@@)
src/common/                여러 장이 함께 쓰는 코드(한 곳만 고치면 모든 장에 반영)
src/data/                  문제은행·국시 태그·증례·검색 색인·링크 목록
tools/                     build.py · qbank.js · links.py · test.py · unpack.py
```

```bash
node tools/qbank.js            # 장 퀴즈·국시 태그를 고쳤을 때 → src/data/qbank.json
python3 tools/links.py         # 링크를 고쳤을 때 → src/data/links.json (--check: 실제 점검 보고서)
python3 tools/build.py         # → dist/근육기원통증_웹앱.html
cp dist/근육기원통증_웹앱.html index.html
python3 tools/test.py index.html   # 자동 점검(Chrome + pip install playwright)
```

화면에서 고친 내용(✏️ 내용 수정, ✎ 퀴즈 편집)은 '수정본 파일로 저장'으로 새 index.html을 만들어 올려도 됩니다.

## 학생 기록(브라우저 저장소)
`mp-notes-v1:<장>` 필기 · `<장>-quiz-v1/v2` 장 퀴즈 · `mp-study-v1` 복습·모의고사 · `mp-cases-v1` 증례 · `mp-fq-v1` 근육 역방향 퀴즈 · `mp-qedit-v1` 교수 퀴즈 편집
