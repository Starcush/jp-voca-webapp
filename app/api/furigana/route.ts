import { join } from "node:path";
import { NextResponse } from "next/server";
import * as kuromoji from "kuromoji";
import type { IpadicFeatures, Tokenizer } from "kuromoji";

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

    return NextResponse.json({ furigana });
  } catch {
    return NextResponse.json(
      { error: "failed to generate furigana" },
      { status: 500 },
    );
  }
}

