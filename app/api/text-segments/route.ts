import { NextResponse } from "next/server";
import type { IpadicFeatures } from "kuromoji";
import { getJapaneseTokenizer } from "@/lib/japanese-tokenizer";
import type { Language } from "@/types/language";

export const runtime = "nodejs";

type TextSegment = {
  isWord: boolean;
  text: string;
};

function isLanguage(value: unknown): value is Language {
  return value === "ja" || value === "en" || value === "zh";
}

function isPredicateToken(token: IpadicFeatures) {
  return (
    token.pos === "動詞" || token.pos === "形容詞" || token.pos === "助動詞"
  );
}

function continuesPredicate(token: IpadicFeatures) {
  return (
    token.pos === "助動詞" ||
    (token.pos === "動詞" && token.pos_detail_1 === "非自立") ||
    (token.pos === "助詞" && token.pos_detail_1 === "接続助詞")
  );
}

function segmentJapanese(tokens: IpadicFeatures[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let predicateOpen = false;

  tokens.forEach((token) => {
    const text = token.surface_form;
    const isWord = token.pos !== "記号";

    if (predicateOpen && continuesPredicate(token)) {
      const previousSegment = segments.at(-1);

      if (previousSegment?.isWord) {
        previousSegment.text += text;
        predicateOpen = isPredicateToken(token) || continuesPredicate(token);
        return;
      }
    }

    segments.push({ isWord, text });
    predicateOpen = isPredicateToken(token);
  });

  return segments;
}

function segmentWithIntl(text: string, language: Language): TextSegment[] {
  const segmenter = new Intl.Segmenter(language, { granularity: "word" });

  return Array.from(segmenter.segment(text), (segment) => ({
    isWord: Boolean(segment.isWordLike),
    text: segment.segment,
  }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    language?: unknown;
    text?: unknown;
  } | null;
  const text = typeof body?.text === "string" ? body.text : "";
  const language = body?.language;

  if (!text.trim() || !isLanguage(language)) {
    return NextResponse.json(
      { error: "text and language are required" },
      { status: 400 },
    );
  }

  try {
    const segments =
      language === "ja"
        ? segmentJapanese(
            (await getJapaneseTokenizer()).tokenize(text),
          )
        : segmentWithIntl(text, language);

    return NextResponse.json({ segments });
  } catch (error) {
    console.error("Failed to segment selectable OCR text.", error);
    return NextResponse.json(
      { error: "failed to segment text" },
      { status: 500 },
    );
  }
}
