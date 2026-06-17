# jp-voca-webapp

일본어 단어를 직접 저장하고 복습하는 개인 단어장 MVP입니다.

## 현재 MVP 기능

- 사용자 이름 기반 간단 로그인
- 단어 추가, 수정, 삭제
- 한자, 후리가나, 뜻, 예문, 예문 번역 저장
- 한자/뜻 가리기 모드와 카드별 공개
- 알았어요/모르겠어요 학습 상태 기록
- 검색, 상태 필터, 오래 안 본 단어 정렬
- 단어 목록 더 보기 페이지네이션
- 한자 입력값 기반 후리가나 자동 생성

## 로컬 실행

```bash
nvm use
npm install
npm run dev
```

로컬에서 Firestore 기능을 쓰려면 `.env.local`에 Firebase Web App 값을 넣어야 합니다.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Vercel 배포 설정

Vercel 프로젝트의 Environment Variables에 로컬과 같은 `NEXT_PUBLIC_FIREBASE_*` 값을 추가합니다.

환경변수를 새로 추가하거나 수정한 뒤에는 Vercel에서 다시 배포해야 최신 값이 적용됩니다.

## Firestore 설정

현재 MVP는 Firebase Authentication을 붙이기 전 단계라서, 테스트용 Firestore Rules가 필요합니다. 아래 규칙은 개발/테스트용으로만 사용하세요.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, create: if true;
      allow update, delete: if false;
    }

    match /words/{wordId} {
      allow read, write: if true;
    }
  }
}
```

배포된 앱에서 `Missing or insufficient permissions`가 나오면 Firestore Rules가 아직 반영되지 않았거나, 다른 Firebase 프로젝트의 환경변수를 보고 있을 가능성이 큽니다.

## Firestore 인덱스

단어 목록은 `uid`로 필터링하고 `createdAt` 내림차순으로 정렬합니다. Firebase 콘솔에서 인덱스 생성 링크가 뜨면 그대로 열어서 아래 조합의 composite index를 생성하면 됩니다.

- Collection: `words`
- Fields: `uid` ascending, `createdAt` descending

## 주요 명령어

```bash
npm run typecheck
npm run lint
npm run build
```

## MVP 이후 후보

- Firebase Authentication 기반 실제 사용자 인증
- 사용자별 Firestore 보안 규칙 강화
- CSV 가져오기/내보내기
- 학습 세션과 복습 통계
- 모바일 입력 경험 개선
