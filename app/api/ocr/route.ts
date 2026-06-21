import { NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/google-vision";
import { isLanguage } from "@/lib/languages";
import type { Language } from "@/types/language";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

const languageHints: Record<Language, string[]> = {
  en: ["en"],
  ja: ["ja", "en"],
  zh: ["zh", "zh-CN", "en"],
};

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
  const language =
    typeof languageValue === "string" && isLanguage(languageValue)
      ? languageValue
      : "ja";

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
    const text = await extractTextFromImage(buffer, languageHints[language]);

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Failed to extract OCR text.", error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
