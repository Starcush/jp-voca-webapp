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

type MeaningSuggestion = {
  meaning: string;
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

function parseMeaningSuggestion(text: string): MeaningSuggestion {
  try {
    const parsed = JSON.parse(text) as Partial<MeaningSuggestion>;
    const meaning = typeof parsed.meaning === "string" ? parsed.meaning.trim() : "";

    return { meaning };
  } catch {
    return { meaning: text.trim() };
  }
}

export async function suggestMeaningWithAi({
  language,
  sentence,
  term,
}: {
  language: Language;
  sentence: string;
  term: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return "";
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
                "Return only compact JSON with one key: meaning.",
                "The meaning must be Korean, short, dictionary-like, and context-aware.",
                "Do not include explanations, markdown, or examples.",
              ].join("\n"),
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      max_output_tokens: 120,
      model,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to suggest meaning with AI.");
  }

  const suggestion = parseMeaningSuggestion(
    extractOutputText((await response.json()) as OpenAiResponse),
  );

  return suggestion.meaning;
}
