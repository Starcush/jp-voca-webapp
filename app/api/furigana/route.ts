import { join } from "node:path";
import { NextResponse } from "next/server";
import * as kuromoji from "kuromoji";
import type { IpadicFeatures, Tokenizer } from "kuromoji";
import { suggestVocabularyWithAi } from "@/lib/openai-meaning";

export const runtime = "nodejs";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | undefined;

function getTokenizer() {
  tokenizerPromise ??= new Promise((resolve, reject) => {
    kuromoji
      .builder({
        dicPath: join(process.cwd(), "node_modules/kuromoji/dict"),
      })
      .build((error, tokenizer) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(tokenizer);
      });
  });

  return tokenizerPromise;
}

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
    const tokenizer = await getTokenizer();
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
