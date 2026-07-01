import type { ViewMode, WordFilter } from "@/components/words/types";

/**
 * 단어 목록에서 사용할 카드 보기 모드 탭 옵션입니다.
 */
export const viewTabs: Array<{
  label: string;
  value: ViewMode;
}> = [
  { label: "전체 보기", value: "all" },
  { label: "한자 가리기", value: "kanji" },
  { label: "뜻 가리기", value: "meaning" },
];

/**
 * 단어 목록에서 사용할 상태 필터 버튼 옵션입니다.
 */
export const filters: Array<{
  label: string;
  value: WordFilter;
}> = [
  { label: "전체", value: "all" },
  { label: "모르는 것만", value: "unknown" },
  { label: "오래 안 본 것", value: "stale" },
];
