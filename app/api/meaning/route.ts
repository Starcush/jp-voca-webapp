import { NextResponse } from "next/server";
import {
  getMeaningCache,
  normalizeMeaningTerm,
  setMeaningCache,
} from "@/lib/meaning-cache";
import { suggestMeaningWithAi } from "@/lib/openai-meaning";
import { isLanguage } from "@/lib/languages";
import type { Language } from "@/types/language";

export const runtime = "nodejs";

type MeaningRequestBody = {
  language?: unknown;
  reading?: unknown;
  sentence?: unknown;
  term?: unknown;
};

function getMeaningErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "failed to suggest meaning";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MeaningRequestBody | null;
  const language =
    typeof body?.language === "string" && isLanguage(body.language)
      ? body.language
      : null;
  const term = typeof body?.term === "string" ? body.term.trim() : "";
  const sentence = typeof body?.sentence === "string" ? body.sentence.trim() : "";
  const reading = typeof body?.reading === "string" ? body.reading.trim() : "";

  if (!language) {
    return NextResponse.json(
      { error: "language is required" },
      { status: 400 },
    );
  }

  if (!term) {
    return NextResponse.json(
      { error: "term is required" },
      { status: 400 },
    );
  }

  const normalizedTerm = normalizeMeaningTerm(term);

  try {
    const cachedMeaning = await getMeaningCache(language, normalizedTerm).catch(
      (error) => {
        console.error("Failed to read meaning cache.", error);
        return null;
      },
    );

    if (cachedMeaning) {
      return NextResponse.json({
        meaning: cachedMeaning.meaning,
        reading: cachedMeaning.reading ?? "",
        source: "cache",
      });
    }

    const meaning = await suggestMeaningWithAi({
      language: language as Language,
      sentence,
      term,
    });

    if (meaning) {
      await setMeaningCache({
        language,
        meaning,
        normalizedTerm,
        reading,
        source: "ai",
        term,
      }).catch((error) => {
        console.error("Failed to write meaning cache.", error);
      });
    }

    return NextResponse.json({
      meaning,
      reading,
      source: meaning ? "ai" : "empty",
    });
  } catch (error) {
    console.error("Failed to suggest meaning.", error);

    return NextResponse.json(
      { error: getMeaningErrorMessage(error) },
      { status: 500 },
    );
  }
}
