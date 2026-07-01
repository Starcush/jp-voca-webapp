# 개발 규칙

## 상태 관리

- Firebase, API route, 외부 서비스처럼 원격에서 읽고 쓰는 서버 상태는 기본적으로 TanStack Query를 사용한다.
- 단어 목록, 단어 개수, 페이지네이션, 복습용 단어 조회, 사용자 설정 조회처럼 로딩/에러/재요청/캐시 갱신이 필요한 데이터는 `useQuery` 또는 `useInfiniteQuery`로 관리한다.
- 서버 상태를 변경하는 작업은 mutation 이후 관련 query를 invalidate 하거나, 필요한 경우 `queryClient.setQueryData` / `setQueriesData`로 캐시를 명시적으로 갱신한다.
- 컴포넌트 안에서만 의미가 있는 UI 상태는 React local state를 유지한다. 예: 입력 중인 폼 값, 현재 선택된 탭, 카드 공개 여부, OCR 드래그 선택, 임시 staging 목록.
- 여러 로컬 상태가 함께 움직이며 전이가 복잡해지면 `useReducer` 또는 도메인별 custom hook으로 먼저 정리한다.
- Zustand 같은 전역 client state 라이브러리는 여러 화면에서 공유되는 순수 client state가 실제로 커졌을 때 도입한다.

## TanStack Query 적용 기준

- `useEffect`에서 원격 데이터를 직접 fetch하고 `isLoading`, `errorMessage`, `data`를 각각 `useState`로 관리하는 새 코드는 만들지 않는다.
- 기존 코드가 같은 패턴이라면 기능을 추가할 때 TanStack Query로 점진적으로 이전한다.
- query key는 도메인, 동작, 사용자 id, 언어, 필터처럼 캐시를 구분하는 값을 명시적으로 포함한다.
- URL query로 표현되는 언어/필터/검색 조건은 query key에 반영해 새 조건의 서버 상태가 분리되도록 한다.

## 컴포넌트 구조

- 화면 컴포넌트가 서버 상태 조회, 로컬 상태 전이, 툴바, 빈 상태, 에러 상태, 목록 렌더링을 모두 직접 들고 있으면 기능별 파일로 분리한다.
- 서버 상태와 캐시 갱신은 `use{Domain}Query` 같은 도메인 훅으로 분리한다.
- 화면 안에서만 쓰는 로컬 상태 전이는 `use{Domain}State` 훅이나 작은 이벤트 핸들러로 분리한다.
- 반복되는 UI 덩어리는 `Toolbar`, `EmptyState`, `ErrorState`, `List`, `Tabs`처럼 역할이 드러나는 컴포넌트로 나눈다.
- 최상위 화면 컴포넌트는 가능하면 데이터 훅 호출, 상태별 화면 선택, 하위 컴포넌트 조립만 담당하게 유지한다.
- 새로 export하는 컴포넌트, 훅, 유틸 함수, 상수, 공유 타입에는 역할, 주요 입력, 반환값을 알 수 있는 JSDoc을 export 선언 위에 작성한다.
- 함수형 export는 `@param`과 `@returns`를 사용하고, 객체 타입 export는 필요한 경우 `@property`로 주요 필드를 설명한다.
