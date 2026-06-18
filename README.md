# jp-voca-webapp

일본어 단어를 직접 저장하고 복습하는 개인 단어장 MVP입니다.

## 현재 MVP 기능

- 이메일과 비밀번호 기반 로그인
- 가입 후 기본 학습 언어 선택
- 단어 추가, 수정, 삭제
- 한자, 후리가나, 뜻, 예문, 예문 번역 저장
- 한자/뜻 가리기 모드와 카드별 공개
- 알았어요/모르겠어요 학습 상태 기록
- 검색, 상태 필터, 오래 안 본 단어 정렬
- 단어 목록 더 보기 페이지네이션
- 한자 입력값 기반 후리가나 자동 생성
- 비밀번호 재설정 메일 발송

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

현재 MVP 로그인은 Firebase Email/Password Auth를 사용합니다. Firebase Console의 Authentication에서 **Email/Password** 로그인 제공자를 활성화해야 합니다.

이메일은 중복 가입 방지와 계정 복구를 위해 사용합니다. 비밀번호는 Firebase Auth 기본 정책에 맞춰 6자 이상이어야 합니다.

가입 후 일본어, 영어, 중국어 중 하나를 기본 학습 언어로 선택합니다. 선택한 언어는 `users/{uid}.defaultLanguage`에 저장됩니다.

Firestore Rules는 Firebase Auth uid 기준으로 사용자별 데이터만 접근하도록 설정합니다.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read: if isOwner(uid);
      allow create, update: if isOwner(uid)
        && request.resource.data.uid == uid;
      allow delete: if false;
    }

    match /words/{wordId} {
      allow read, update, delete: if isSignedIn()
        && resource.data.uid == request.auth.uid;
      allow create: if isSignedIn()
        && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

배포된 앱에서 `Missing or insufficient permissions`가 나오면 Firestore Rules가 아직 반영되지 않았거나, 다른 Firebase 프로젝트의 환경변수를 보고 있을 가능성이 큽니다.

`Firebase Authentication에서 Email/Password 로그인을 켜주세요.`가 나오면 Firebase Console의 Authentication > Sign-in method에서 Email/Password 제공자를 켜면 됩니다.

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

- 이메일 인증과 계정 관리
- CSV 가져오기/내보내기
- 학습 세션과 복습 통계
- 모바일 입력 경험 개선
