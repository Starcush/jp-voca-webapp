import type { Language } from "@/types/language";

export type VocabularySuggestionInput = {
  language: Language;
  reading: string;
  sentence: string;
  term: string;
};

export type VocabularySuggestion = {
  failed: boolean;
  meaning: string;
  reading: string;
};

/**
 * 언어별 읽기 생성 API를 호출해 일본어 후리가나 또는 중국어 병음을 반환합니다.
 *
 * @param language - 읽기를 생성할 언어입니다. 영어는 읽기 필드가 없어 빈 문자열을 반환합니다.
 * @param text - 읽기를 만들 단어 또는 표현입니다.
 * @returns 생성된 읽기 문자열입니다. 실패하거나 영어일 경우 빈 문자열입니다.
 */
export async function generateVocabularyReading(
  language: Language,
  text: string,
) {
  if (language === "en") {
    return "";
  }

  const response = await fetch(language === "zh" ? "/api/pinyin" : "/api/furigana", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = (await response.json().catch(() => null)) as {
    furigana?: unknown;
    pinyin?: unknown;
    reading?: unknown;
  } | null;
  const reading = data?.reading ?? data?.furigana ?? data?.pinyin;

  if (!response.ok || typeof reading !== "string") {
    return "";
  }

  return reading;
}

/**
 * AI/캐시 기반 단어 추천 API를 호출해 읽기와 한국어 뜻을 함께 반환합니다.
 *
 * @param input - 추천에 사용할 언어, 단어, 기존 읽기, 예문 정보입니다.
 * @returns 추천된 읽기/뜻과 실패 여부를 반환합니다.
 */
export async function suggestVocabulary(
  input: VocabularySuggestionInput,
): Promise<VocabularySuggestion> {
  const response = await fetch("/api/meaning", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => null)) as {
    meaning?: unknown;
    reading?: unknown;
  } | null;

  if (!response.ok || typeof data?.meaning !== "string") {
    return { failed: true, meaning: "", reading: "" };
  }

  return {
    failed: false,
    meaning: data.meaning,
    reading: typeof data.reading === "string" ? data.reading : "",
  };
}
