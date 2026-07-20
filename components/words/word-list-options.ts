import type { ViewMode } from "@/components/words/types";
import type { Language } from "@/types/language";

/**
 * 언어별 단어 목록 카드 보기 모드 탭 옵션을 반환합니다.
 *
 * @param language - 현재 단어 목록의 학습 언어입니다.
 * @returns 현재 언어에 맞는 카드 보기 모드 라벨과 값을 반환합니다.
 */
export function getViewTabs(language: Language): Array<{
  label: string;
  value: ViewMode;
}> {
  return [
    { label: "전체", value: "all" },
    {
      label: language === "en" ? "단어만 보기" : "한자만 보기",
      value: "kanji",
    },
    { label: "뜻만 보기", value: "meaning" },
  ];
}
