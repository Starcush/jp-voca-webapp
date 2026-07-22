import { prepareImageForOcr } from "@/components/ocr/useOcrImage";
import type { Language } from "@/types/language";
import type { OcrExtractionResult, OcrTextBox } from "@/types/ocr";

/**
 * 알 수 없는 OCR API 응답 값이 사진 위 텍스트 박스 형태인지 확인합니다.
 *
 * @param value - OCR API에서 받은 토큰 후보 값입니다.
 * @returns 사진 위 선택에 사용할 수 있는 OCR 텍스트 박스이면 true를 반환합니다.
 */
export function isOcrTextBox(value: unknown): value is OcrTextBox {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OcrTextBox>;

  return (
    typeof candidate.height === "number" &&
    typeof candidate.id === "string" &&
    typeof candidate.pageIndex === "number" &&
    typeof candidate.text === "string" &&
    typeof candidate.width === "number" &&
    typeof candidate.x === "number" &&
    typeof candidate.y === "number"
  );
}

/**
 * 사진 위 선택에 필요한 OCR 텍스트와 좌표 정보를 요청합니다.
 *
 * @param imageFile - OCR로 분석할 이미지 파일입니다.
 * @param language - OCR 언어 힌트로 사용할 현재 언어입니다.
 * @returns 추출 텍스트와 사진 위 텍스트 박스 목록을 반환합니다.
 */
export async function extractPhotoLayout(
  imageFile: File,
  language: Language,
): Promise<OcrExtractionResult> {
  const preparedImage = await prepareImageForOcr(imageFile);
  const formData = new FormData();
  formData.append("image", preparedImage, "ocr-image.jpg");
  formData.append("language", language);
  formData.append("readingDirection", "auto");
  formData.append("includeLayout", "true");

  const response = await fetch("/api/ocr", {
    body: formData,
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
    text?: unknown;
    tokens?: unknown;
  } | null;

  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "사진에서 텍스트를 추출하지 못했습니다.",
    );
  }

  return {
    text: typeof body?.text === "string" ? body.text : "",
    tokens: Array.isArray(body?.tokens) ? body.tokens.filter(isOcrTextBox) : [],
  };
}

/**
 * 사진 위에서 선택된 OCR 토큰을 저장할 표현 문자열로 합칩니다.
 *
 * @param tokens - 선택된 OCR 텍스트 박스 목록입니다.
 * @param language - 영어일 때 단어 사이 공백을 유지하기 위한 현재 언어입니다.
 * @returns 저장 후보로 사용할 선택 텍스트를 반환합니다.
 */
export function joinSelectedText(tokens: OcrTextBox[], language: Language) {
  const separator = language === "en" ? " " : "";

  return tokens
    .map((token) => token.text)
    .join(separator)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 사진 위 OCR 토큰 하이라이트 색상을 반환합니다.
 *
 * @param isSelected - 사용자가 현재 선택한 토큰인지 여부입니다.
 * @returns primary 색상의 rgba 문자열을 반환합니다.
 */
export function getTokenHighlightColor(isSelected: boolean) {
  const primaryRgb = "252, 75, 31";

  return `rgba(${primaryRgb}, ${isSelected ? 0.52 : 0.24})`;
}

/**
 * 사진 확대 배율을 테스트 화면에서 지원하는 범위로 제한합니다.
 *
 * @param value - 사용자가 요청한 다음 확대 배율입니다.
 * @returns 1배에서 3배 사이로 제한된 확대 배율을 반환합니다.
 */
export function clampZoom(value: number) {
  return Math.min(3, Math.max(1, value));
}
