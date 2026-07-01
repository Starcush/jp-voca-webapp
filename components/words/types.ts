/**
 * 단어 카드에서 어떤 정보를 가릴지 결정하는 보기 모드입니다.
 */
export type ViewMode = "all" | "kanji" | "meaning";

/**
 * 단어 목록에 적용할 상태 기반 필터입니다.
 */
export type WordFilter = "all" | "unknown" | "stale";

/**
 * 단어 목록 UI에서 언어별로 달라지는 표시 라벨입니다.
 *
 * @property hideTermLabel - 단어/한자 가리기 탭에 표시할 라벨입니다.
 * @property label - 사용자에게 보여줄 언어 이름입니다.
 * @property termLabel - 빈 상태나 입력 안내에서 사용할 단어 필드 라벨입니다.
 */
export type WordLanguageOption = {
  hideTermLabel: string;
  label: string;
  termLabel: string;
};
