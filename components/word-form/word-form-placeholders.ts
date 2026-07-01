import type { Language } from "@/types/language";

/**
 * 언어별 단어/표현 입력 placeholder를 반환합니다.
 *
 * @param language - 현재 단어 폼 언어입니다.
 * @returns 단어/표현 입력에 사용할 예시 문구를 반환합니다.
 */
export function getTermPlaceholder(language: Language) {
  if (language === "en") {
    return "apple";
  }

  if (language === "zh") {
    return "你好";
  }

  return "食べる";
}

/**
 * 언어별 읽기 입력 placeholder를 반환합니다.
 *
 * @param language - 현재 단어 폼 언어입니다.
 * @returns 읽기 입력에 사용할 예시 문구를 반환합니다.
 */
export function getReadingPlaceholder(language: Language) {
  if (language === "zh") {
    return "ni hao";
  }

  return "たべる";
}

/**
 * 언어별 뜻 입력 placeholder를 반환합니다.
 *
 * @param language - 현재 단어 폼 언어입니다.
 * @returns 뜻 입력에 사용할 예시 문구를 반환합니다.
 */
export function getMeaningPlaceholder(language: Language) {
  if (language === "en") {
    return "사과";
  }

  if (language === "zh") {
    return "안녕하세요";
  }

  return "먹다";
}

/**
 * 언어별 예문 입력 placeholder를 반환합니다.
 *
 * @param language - 현재 단어 폼 언어입니다.
 * @returns 예문 입력에 사용할 예시 문구를 반환합니다.
 */
export function getExamplePlaceholder(language: Language) {
  if (language === "en") {
    return "I eat an apple.";
  }

  if (language === "zh") {
    return "你好，今天见到你很高兴。";
  }

  return "朝ごはんを食べる。";
}
