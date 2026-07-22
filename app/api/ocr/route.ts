import { NextResponse } from "next/server";
import {
  extractOcrResultFromImage,
  extractTextFromImage,
} from "@/lib/google-vision";
import { isLanguage } from "@/lib/languages";
import type { Language } from "@/types/language";
import type { OcrReadingDirection } from "@/types/ocr";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

const languageHints: Record<Language, string[]> = {
  en: ["en"],
  ja: ["ja", "en"],
  zh: ["zh", "zh-CN", "en"],
};
const readingDirections = new Set<OcrReadingDirection>([
  "auto",
  "horizontal",
  "vertical-rl",
]);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "failed to extract text";
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const image = formData?.get("image");
  const languageValue = formData?.get("language");
  const readingDirectionValue = formData?.get("readingDirection");
  const includeLayout = formData?.get("includeLayout") === "true";
  const language =
    typeof languageValue === "string" && isLanguage(languageValue)
      ? languageValue
      : "ja";
  const readingDirection =
    typeof readingDirectionValue === "string" &&
    readingDirections.has(readingDirectionValue as OcrReadingDirection)
      ? (readingDirectionValue as OcrReadingDirection)
      : "auto";

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "image is required" },
      { status: 400 },
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "image must be an image file" },
      { status: 400 },
    );
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "image must be 4MB or smaller" },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await image.arrayBuffer());
    if (includeLayout) {
      const result = await extractOcrResultFromImage(
        buffer,
        languageHints[language],
        readingDirection,
      );

      return NextResponse.json(result);
    }

    const text = await extractTextFromImage(
      buffer,
      languageHints[language],
      readingDirection,
    );

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Failed to extract OCR text.", error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
