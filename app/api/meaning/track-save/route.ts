import { NextResponse } from "next/server";
import {
  incrementMeaningSavedCount,
  normalizeMeaningTerm,
} from "@/lib/meaning-cache";
import { isLanguage } from "@/lib/languages";

export const runtime = "nodejs";

type TrackSaveRequestBody = {
  entries?: unknown;
  language?: unknown;
};

type TrackSaveEntry = {
  meaning?: unknown;
  reading?: unknown;
  term?: unknown;
};

function isTrackSaveEntry(value: unknown): value is TrackSaveEntry {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TrackSaveRequestBody | null;
  const language =
    typeof body?.language === "string" && isLanguage(body.language)
      ? body.language
      : null;
  const entries = Array.isArray(body?.entries) ? body.entries : [];

  if (!language) {
    return NextResponse.json(
      { error: "language is required" },
      { status: 400 },
    );
  }

  const normalizedEntries = entries
    .filter(isTrackSaveEntry)
    .map((entry) => ({
      meaning: typeof entry.meaning === "string" ? entry.meaning.trim() : "",
      reading: typeof entry.reading === "string" ? entry.reading.trim() : "",
      term: typeof entry.term === "string" ? entry.term.trim() : "",
    }))
    .filter((entry) => entry.term);

  if (normalizedEntries.length === 0) {
    return NextResponse.json({ tracked: 0 });
  }

  await Promise.all(
    normalizedEntries.map((entry) =>
      incrementMeaningSavedCount({
        language,
        meaning: entry.meaning || undefined,
        normalizedTerm: normalizeMeaningTerm(entry.term),
        reading: entry.reading || undefined,
        term: entry.term,
      }),
    ),
  );

  return NextResponse.json({ tracked: normalizedEntries.length });
}
