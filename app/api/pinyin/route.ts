import { NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";

export const runtime = "nodejs";

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
    const reading = pinyin(text, {
      nonZh: "removed",
      separator: " ",
      toneType: "symbol",
      type: "string",
    }).trim();

    if (!reading) {
      return NextResponse.json(
        { error: "chinese text is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({ pinyin: reading, reading });
  } catch {
    return NextResponse.json(
      { error: "failed to generate pinyin" },
      { status: 500 },
    );
  }
}
