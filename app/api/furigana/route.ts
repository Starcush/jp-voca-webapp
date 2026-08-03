import { NextResponse } from "next/server";
import type { IpadicFeatures } from "kuromoji";
import { getJapaneseTokenizer } from "@/lib/japanese-tokenizer";
import { suggestVocabularyWithAi } from "@/lib/openai-meaning";

export const runtime = "nodejs";

function katakanaToHiragana(value: string) {
  return value.replace(/[\u30a1-\u30f6]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60),
  );
}

function toFurigana(tokens: IpadicFeatures[]) {
  return tokens
    .map((token) => katakanaToHiragana(token.reading ?? token.surface_form))
    .join("");
}

function containsHanCharacter(value: string) {
  return /\p{Script=Han}/u.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    text?: unknown;
  } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 },
    );
  }

  try {
    const tokenizer = await getJapaneseTokenizer();
    const furigana = toFurigana(tokenizer.tokenize(text));

    if (!containsHanCharacter(furigana)) {
      return NextResponse.json({ furigana, reading: furigana, source: "kuromoji" });
    }

    const suggestion = await suggestVocabularyWithAi({
      language: "ja",
      reading: furigana,
      sentence: "",
      term: text,
    }).catch((error) => {
      console.error("Failed to correct furigana with AI.", error);
      return { meaning: "", reading: "" };
    });
    const correctedFurigana = suggestion.reading.trim();

    if (correctedFurigana && !containsHanCharacter(correctedFurigana)) {
      return NextResponse.json({
        fallbackReading: furigana,
        furigana: correctedFurigana,
        reading: correctedFurigana,
        source: "ai",
      });
    }

    return NextResponse.json({ furigana, reading: furigana, source: "kuromoji" });
  } catch {
    return NextResponse.json(
      { error: "failed to generate furigana" },
      { status: 500 },
    );
  }
}
