import type { ViewMode } from "@/components/words/types";

/**
 * 단어 목록에서 사용할 카드 보기 모드 탭 옵션입니다.
 */
export const viewTabs: Array<{
  label: string;
  value: ViewMode;
}> = [
  { label: "전체", value: "all" },
  { label: "한자만 보기", value: "kanji" },
  { label: "뜻만 보기", value: "meaning" },
];
