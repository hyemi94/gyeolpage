# 결 페이지 (GyeolPage) - React + Vite

이상형과 가치관을 객관식 위주로 답하면 프로필 카드가 만들어지고, 여러 페이지 이미지(PNG/ZIP) 또는 PDF로 저장하는 웹 도구입니다.
서버가 없는 정적 사이트이고, 입력한 내용은 방문자 브라우저(localStorage)에만 저장됩니다. 연락처는 받지 않아요.

## 개발

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 생성
npm run preview    # 빌드 결과 확인
```

Node 18 이상이면 됩니다.

## GitHub에 올리기

```bash
git init
git add .
git commit -m "결 페이지 첫 버전"
git branch -M main
git remote add origin https://github.com/내아이디/gyeolpage.git
git push -u origin main
```

GitHub에서 빈 저장소(`gyeolpage`)를 먼저 만들어 두세요. `node_modules`와 `dist`는 `.gitignore`에 들어 있어서 올라가지 않아요.

## Hostinger Node.js 웹 앱으로 배포

1. hPanel → **웹사이트 → 웹사이트 추가 → Node.js 앱**을 고릅니다.
2. 이 폴더를 올립니다. 둘 중 하나로 하세요.
   - **파일 업로드**: `node_modules`와 `dist`를 뺀 zip을 업로드 (이 프로젝트 zip은 이미 그렇게 만들어져 있어요)
   - **GitHub 연결**: 저장소를 만들어 올린 뒤 연결
3. 빌드 설정을 확인합니다.
   - 프레임워크: **Vite** (또는 React)
   - Node 버전: 18 / 20 / 22 중 아무거나
   - 빌드 명령: `npm run build` (스크립트 이름 `build`)
   - 출력 폴더: `dist`
   - 시작(엔트리) 파일: 필요 없어요 (정적 빌드)
4. **배포**를 누르면 설치와 빌드가 자동으로 진행되고, 끝나면 도메인에서 열립니다.
5. 코드를 고친 뒤에는 같은 방법으로 다시 올리거나, GitHub에 푸시한 뒤 재배포하면 됩니다.

`vite.config.js`의 `base: './'` 덕분에 도메인 루트가 아닌 하위 폴더에 올려도 동작합니다.

## 구조

```
src/
  data/questions.js   카테고리·질문·보기
  lib/logic.js        답 → 카드 모델, 키워드, 한 줄 소개
  lib/actions.js      선택·기타 추가·프리셋·예시 채우기
  lib/export.js       캔버스로 여러 페이지를 그려 PNG(ZIP)/PDF 저장
  lib/storage.js      localStorage 저장·불러오기 (키: gyeolpage.v2)
  components/         Editor(질문), Preview(카드)
  config.js           광고 설정
  i18n/ko.js          화면 고정 문구 (영어를 추가하려면 en.js를 같은 키로 만들면 돼요)
```

## 광고(AdSense)와 안내 페이지

- `public/` 안의 `guide/`(가이드 글 3개와 목록), `about.html`, `privacy.html`은 자바스크립트 없이 읽히는 일반 HTML이라 검색·광고 심사에서 내용이 보여요. 파일을 직접 고치면 됩니다.
- **연락 이메일과 시행일**은 `about.html`과 `privacy.html`에 들어 있어요. 이메일을 바꿀 때는 두 파일에서 `hyemi94@naver.com`을 찾아 바꾸세요. 광고를 달 거라면 개인정보처리방침의 광고 항목도 실제 상황에 맞는지 확인하세요.
- 광고 자리는 `src/config.js`의 `ADSENSE_CLIENT`, `ADSENSE_SLOT`을 채우면 카드 미리보기 아래에 켜져요. 비워 두면 광고 코드가 로드되지 않아요.
- AdSense 사이트 등록·심사는 Google 계정에서 직접 진행하고, 승인 뒤 `public/ads.txt`에 Google이 안내하는 한 줄을 넣으세요.

## 참고

- 질문을 고치려면 `src/data/questions.js`만 수정하면 됩니다.
- 저장 데이터 구조를 바꾸면 `storage.js`의 `KEY`를 올려 주세요.
- 질문 키(`id`)를 바꾸면 방문자의 기존 답이 사라질 수 있어요.
