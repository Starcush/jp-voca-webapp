import { prepareImageForOcr } from "@/components/ocr/useOcrImage";
import type { Language } from "@/types/language";
import type { OcrExtractionResult, OcrTextBox } from "@/types/ocr";

/**
 * 같은 문장과 줄 또는 열에 속한 OCR 토큰을 합친 하이라이트 영역입니다.
 *
 * @property height - 이미지 높이를 기준으로 정규화한 영역 높이입니다.
 * @property id - 렌더링에 사용할 안정적인 영역 ID입니다.
 * @property sentenceId - 영역이 속한 문장 그룹 ID입니다.
 * @property tokenIds - 영역에 포함된 원본 OCR 토큰 ID 목록입니다.
 * @property width - 이미지 너비를 기준으로 정규화한 영역 너비입니다.
 * @property x - 이미지 왼쪽을 기준으로 정규화한 x 좌표입니다.
 * @property y - 이미지 위쪽을 기준으로 정규화한 y 좌표입니다.
 */
export type OcrHighlightRegion = {
  height: number;
  id: string;
  sentenceId: string;
  tokenIds: string[];
  width: number;
  x: number;
  y: number;
};

/**
 * 원본 이미지 좌표를 기준으로 화면에 표시할 정규화 영역입니다.
 *
 * @property height - 원본 이미지 높이를 1로 봤을 때 표시할 높이입니다.
 * @property width - 원본 이미지 너비를 1로 봤을 때 표시할 너비입니다.
 * @property x - 표시 영역이 시작하는 정규화 x 좌표입니다.
 * @property y - 표시 영역이 시작하는 정규화 y 좌표입니다.
 */
export type OcrViewportBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

/**
 * OCR 텍스트 전체를 감싸고 지정한 여백을 더한 사진 표시 영역을 계산합니다.
 *
 * @param tokens - Document AI에서 받은 정규화 텍스트 좌표입니다.
 * @param padding - 이미지 한 변을 1로 봤을 때 텍스트 바깥에 추가할 여백입니다.
 * @returns 이미지 경계를 넘지 않는 텍스트 중심 표시 영역을 반환합니다.
 */
export function getTextViewportBounds(
  tokens: OcrTextBox[],
  padding = 0.05,
): OcrViewportBounds {
  if (tokens.length === 0) {
    return { height: 1, width: 1, x: 0, y: 0 };
  }

  const safePadding = Math.max(0, padding);
  const x = Math.max(0, Math.min(...tokens.map((token) => token.x)) - safePadding);
  const y = Math.max(0, Math.min(...tokens.map((token) => token.y)) - safePadding);
  const right = Math.min(
    1,
    Math.max(...tokens.map((token) => token.x + token.width)) + safePadding,
  );
  const bottom = Math.min(
    1,
    Math.max(...tokens.map((token) => token.y + token.height)) + safePadding,
  );

  return {
    height: bottom - y,
    width: right - x,
    x,
    y,
  };
}

function getTokenCenter(token: OcrTextBox) {
  return {
    x: token.x + token.width / 2,
    y: token.y + token.height / 2,
  };
}

function isVerticalLayout(tokens: OcrTextBox[]) {
  let horizontalMovements = 0;
  let verticalMovements = 0;

  for (let index = 1; index < tokens.length; index += 1) {
    const previousCenter = getTokenCenter(tokens[index - 1]);
    const currentCenter = getTokenCenter(tokens[index]);
    const horizontalDistance = Math.abs(currentCenter.x - previousCenter.x);
    const verticalDistance = Math.abs(currentCenter.y - previousCenter.y);

    if (verticalDistance > horizontalDistance) {
      verticalMovements += 1;
    } else if (horizontalDistance > verticalDistance) {
      horizontalMovements += 1;
    }
  }

  if (verticalMovements !== horizontalMovements) {
    return verticalMovements > horizontalMovements;
  }

  const tallTokenCount = tokens.filter(
    (token) => token.height > token.width * 1.2,
  ).length;
  const wideTokenCount = tokens.filter(
    (token) => token.width > token.height * 1.2,
  ).length;

  return tallTokenCount >= wideTokenCount;
}

/**
 * Document AI 토큰을 서버가 판단한 읽기 순서로 정렬합니다.
 *
 * @param tokens - Document AI에서 받은 텍스트, 정규화 좌표와 읽기 순서입니다.
 * @returns 서버의 readingOrder를 기준으로 정렬한 새 배열을 반환합니다.
 */
export function orderOcrTokens(tokens: OcrTextBox[]) {
  return [...tokens].sort(
    (first, second) => first.readingOrder - second.readingOrder,
  );
}

function createHighlightRegion(
  tokens: OcrTextBox[],
  regionIndex: number,
): OcrHighlightRegion {
  const x = Math.min(...tokens.map((token) => token.x));
  const y = Math.min(...tokens.map((token) => token.y));
  const right = Math.max(...tokens.map((token) => token.x + token.width));
  const bottom = Math.max(...tokens.map((token) => token.y + token.height));
  const sentenceId = tokens[0].sentenceId;

  return {
    height: bottom - y,
    id: `${sentenceId}:${regionIndex}`,
    sentenceId,
    tokenIds: tokens.map((token) => token.id),
    width: right - x,
    x,
    y,
  };
}

function startsNewHighlightRun(
  currentRun: OcrTextBox[],
  token: OcrTextBox,
  isVertical: boolean,
) {
  const previousToken = currentRun.at(-1);

  if (!previousToken) {
    return true;
  }

  const previousCenter = getTokenCenter(previousToken);
  const currentCenter = getTokenCenter(token);
  const trackDistance = isVertical
    ? Math.abs(currentCenter.x - previousCenter.x)
    : Math.abs(currentCenter.y - previousCenter.y);
  const trackSize = isVertical
    ? Math.max(currentRun[0].width, token.width)
    : Math.max(currentRun[0].height, token.height);
  const previousProgress = isVertical
    ? previousCenter.y
    : previousCenter.x;
  const currentProgress = isVertical ? currentCenter.y : currentCenter.x;
  const progressSize = isVertical
    ? Math.max(previousToken.height, token.height)
    : Math.max(previousToken.width, token.width);
  const hasWrapped =
    currentProgress < previousProgress - progressSize * 1.5;

  return hasWrapped || trackDistance > trackSize * 0.8;
}

/**
 * OCR 단어 좌표를 문장별 줄 또는 열 단위의 연속된 하이라이트 영역으로 합칩니다.
 *
 * @param tokens - OCR 엔진에서 받은 읽기 순서, 단어 좌표와 문장 그룹 목록입니다.
 * @returns 사진 위에 렌더링할 문장 하이라이트 영역 목록을 반환합니다.
 */
export function getHighlightRegions(tokens: OcrTextBox[]) {
  const sentenceGroups = new Map<string, OcrTextBox[]>();

  tokens.forEach((token) => {
    const sentenceTokens = sentenceGroups.get(token.sentenceId) ?? [];
    sentenceTokens.push(token);
    sentenceGroups.set(token.sentenceId, sentenceTokens);
  });

  return Array.from(sentenceGroups.values()).flatMap((sentenceTokens) => {
    const isVertical = isVerticalLayout(sentenceTokens);
    const runs: OcrTextBox[][] = [];

    sentenceTokens.forEach((token) => {
      const currentRun = runs.at(-1);

      if (!currentRun || startsNewHighlightRun(currentRun, token, isVertical)) {
        runs.push([token]);
        return;
      }

      currentRun.push(token);
    });

    return runs.map((run, regionIndex) =>
      createHighlightRegion(run, regionIndex),
    );
  });
}

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
    typeof candidate.readingOrder === "number" &&
    typeof candidate.sentenceId === "string" &&
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
 * Document AI 토큰을 문장 그룹별 읽기 순서로 합칩니다.
 *
 * @param tokens - Document AI가 반환한 문장 ID와 읽기 순서를 포함한 토큰입니다.
 * @param language - 영어 문장의 단어 사이 공백을 유지하기 위한 현재 언어입니다.
 * @returns 사진과 문장별 선택 모드가 함께 사용할 문장 문자열 목록을 반환합니다.
 */
export function getOcrSentences(tokens: OcrTextBox[], language: Language) {
  const sentenceGroups = new Map<string, OcrTextBox[]>();

  orderOcrTokens(tokens).forEach((token) => {
    const sentenceTokens = sentenceGroups.get(token.sentenceId) ?? [];
    sentenceTokens.push(token);
    sentenceGroups.set(token.sentenceId, sentenceTokens);
  });

  return Array.from(sentenceGroups.values())
    .map((sentenceTokens) => joinSelectedText(sentenceTokens, language))
    .filter(Boolean);
}

/**
 * 모바일 OS의 사진 텍스트 선택과 유사한 OCR 하이라이트 색상을 반환합니다.
 *
 * @param isSelected - 사용자가 현재 선택한 문장 영역인지 여부입니다.
 * @returns 인식 영역은 옅은 노란색, 선택 영역은 반투명 시스템 블루로 반환합니다.
 */
export function getTokenHighlightColor(isSelected: boolean) {
  return isSelected
    ? "rgba(45, 125, 245, 0.46)"
    : "rgba(255, 210, 55, 0.22)";
}

/**
 * 모바일 OS의 사진 텍스트 선택과 유사한 OCR 하이라이트 외곽 색상을 반환합니다.
 *
 * @param isSelected - 사용자가 현재 선택한 문장 영역인지 여부입니다.
 * @returns 선택 상태에 맞는 얇은 내부 외곽 색상을 반환합니다.
 */
export function getTokenOutlineColor(isSelected: boolean) {
  return isSelected
    ? "rgba(30, 105, 225, 0.72)"
    : "rgba(230, 175, 15, 0.42)";
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
