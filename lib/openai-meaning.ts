import type { Language } from "@/types/language";

type OpenAiContent = {
  text?: string;
  type?: string;
};

type OpenAiOutputItem = {
  content?: OpenAiContent[];
  type?: string;
};

type OpenAiResponse = {
  output?: OpenAiOutputItem[];
  output_text?: string;
};

type VocabularySuggestion = {
  meaning: string;
  reading: string;
};

function getLanguageName(language: Language) {
  if (language === "ja") {
    return "Japanese";
  }

  if (language === "zh") {
    return "Chinese";
  }

  return "English";
}

function extractOutputText(response: OpenAiResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function parseVocabularySuggestion(text: string): VocabularySuggestion {
  try {
    const parsed = JSON.parse(text) as Partial<VocabularySuggestion>;
    const meaning = typeof parsed.meaning === "string" ? parsed.meaning.trim() : "";
    const reading = typeof parsed.reading === "string" ? parsed.reading.trim() : "";

    return { meaning, reading };
  } catch {
    return { meaning: text.trim(), reading: "" };
  }
}

/**
 * AI로 단어 또는 문법 표현의 읽기와 한국어 뜻을 함께 추천합니다.
 *
 * @param input - 추천에 사용할 언어, 선택 표현, 원문 문장, 기존 읽기 후보입니다.
 * @param input.language - 추천 대상 언어 코드입니다.
 * @param input.reading - 사전/라이브러리로 먼저 만든 읽기 후보입니다.
 * @param input.sentence - 표현이 나온 원문 문장입니다.
 * @param input.term - 사용자가 선택한 단어 또는 문법 표현입니다.
 * @returns 추천된 읽기와 한국어 뜻을 반환합니다. API 키가 없으면 빈 값을 반환합니다.
 */
export async function suggestVocabularyWithAi({
  language,
  reading = "",
  sentence,
  term,
}: {
  language: Language;
  reading?: string;
  sentence: string;
  term: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { meaning: "", reading: "" };
  }

  const model = process.env.OPENAI_MEANING_MODEL ?? "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content: [
            {
              text: [
                "You are helping a Korean learner build a vocabulary notebook.",
                `Language: ${getLanguageName(language)}`,
                `Selected term or grammar expression: ${term}`,
                `Source sentence: ${sentence || "(none)"}`,
                `Existing reading candidate: ${reading || "(none)"}`,
                "Return only compact JSON with two keys: reading and meaning.",
                "For Japanese, reading must be the natural yomikata in kana without kanji.",
                "For Chinese, reading must be pinyin with tone marks.",
                "For English, reading must be an empty string.",
                "The meaning must be Korean, short, dictionary-like, and context-aware.",
                "If the existing reading candidate is wrong or contains kanji, correct it.",
                "Do not include explanations, markdown, or examples.",
              ].join("\n"),
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      max_output_tokens: 160,
      model,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to suggest vocabulary with AI.");
  }

  return parseVocabularySuggestion(
    extractOutputText((await response.json()) as OpenAiResponse),
  );
}

/**
 * AI로 단어 또는 문법 표현의 한국어 뜻만 추천합니다.
 *
 * @param input - 추천에 사용할 언어, 선택 표현, 원문 문장입니다.
 * @param input.language - 추천 대상 언어 코드입니다.
 * @param input.sentence - 표현이 나온 원문 문장입니다.
 * @param input.term - 사용자가 선택한 단어 또는 문법 표현입니다.
 * @returns 추천된 한국어 뜻을 반환합니다.
 */
export async function suggestMeaningWithAi(input: {
  language: Language;
  sentence: string;
  term: string;
}) {
  return (await suggestVocabularyWithAi(input)).meaning;
}
