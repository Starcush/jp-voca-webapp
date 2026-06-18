import type { Language } from "@/types/language";

export const DEFAULT_LANGUAGE: Language = "ja";

export const languageOptions: Array<{
  code: Language;
  flag: string;
  label: string;
  summary: string;
  termLabel: string;
  readingLabel?: string;
  readingAutoLabel?: string;
  hideTermLabel: string;
}> = [
  {
    code: "ja",
    flag: "🇯🇵",
    label: "일본어",
    summary: "후리가나 자동 생성을 사용할 수 있습니다.",
    termLabel: "한자 / 단어",
    readingLabel: "후리가나",
    readingAutoLabel: "후리가나 자동 생성",
    hideTermLabel: "한자 가리기",
  },
  {
    code: "en",
    flag: "🇺🇸",
    label: "영어",
    summary: "단어와 뜻 중심으로 빠르게 학습합니다.",
    termLabel: "단어 / 표현",
    hideTermLabel: "단어 가리기",
  },
  {
    code: "zh",
    flag: "🇨🇳",
    label: "중국어",
    summary: "병음 자동 생성을 준비할 수 있습니다.",
    termLabel: "한자 / 단어",
    readingLabel: "병음",
    readingAutoLabel: "병음 자동 생성",
    hideTermLabel: "한자 가리기",
  },
];

export function isLanguage(value: string | undefined): value is Language {
  return value === "ja" || value === "en" || value === "zh";
}

export function getLanguageOption(language: Language) {
  return languageOptions.find((option) => option.code === language) ?? languageOptions[0];
}
