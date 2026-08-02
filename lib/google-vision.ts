import { ImageAnnotatorClient } from "@google-cloud/vision";
import { getGoogleCloudCredentials } from "@/lib/google-cloud-credentials";
import type { OcrReadingDirection } from "@/types/ocr";

let visionClient: ImageAnnotatorClient | undefined;

type VisionVertex = {
  x?: number | null;
  y?: number | null;
};

type VisionBoundingPoly = {
  vertices?: VisionVertex[] | null;
};

type VisionSymbol = {
  text?: string | null;
};

type VisionWord = {
  boundingBox?: VisionBoundingPoly | null;
  symbols?: VisionSymbol[] | null;
};

type VisionParagraph = {
  words?: VisionWord[] | null;
};

type VisionBlock = {
  paragraphs?: VisionParagraph[] | null;
};

type VisionPage = {
  blocks?: VisionBlock[] | null;
  height?: number | null;
  width?: number | null;
};

type VisionTextAnnotation = {
  pages?: VisionPage[] | null;
  text?: string | null;
};

type PositionedOcrToken = {
  centerX: number;
  centerY: number;
  height: number;
  pageHeight: number;
  pageWidth: number;
  text: string;
  width: number;
};

function getVisionClient() {
  if (visionClient) {
    return visionClient;
  }

  const credentials = getGoogleCloudCredentials();
  visionClient = credentials
    ? new ImageAnnotatorClient({ credentials })
    : new ImageAnnotatorClient();

  return visionClient;
}

function getWordText(word: VisionWord) {
  return (
    word.symbols
      ?.map((symbol) => symbol.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function getWordBox(word: VisionWord) {
  const vertices = word.boundingBox?.vertices?.filter(
    (vertex): vertex is { x: number; y: number } =>
      typeof vertex.x === "number" && typeof vertex.y === "number",
  );

  if (!vertices || vertices.length === 0) {
    return null;
  }

  const xs = vertices.map((vertex) => vertex.x);
  const ys = vertices.map((vertex) => vertex.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    centerX: minX + width / 2,
    centerY: minY + height / 2,
    height,
    width,
  };
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);

  return sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPageTokens(page: VisionPage) {
  const tokens: PositionedOcrToken[] = [];
  const pageHeight = page.height ?? 0;
  const pageWidth = page.width ?? 0;

  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      const paragraphTokens = (paragraph.words ?? []).flatMap((word) => {
        const text = getWordText(word);
        const box = getWordBox(word);

        return text && box
          ? [
              {
                ...box,
                pageHeight,
                pageWidth,
                text,
              },
            ]
          : [];
      });

      tokens.push(...paragraphTokens);
    }
  }

  return tokens;
}

function removeVerticalModeNoise(tokens: PositionedOcrToken[]) {
  return tokens.filter((token) => {
    const isStandaloneNoise = /^[0OＤD|｜]+$/.test(token.text);
    const isBottomHorizontalText =
      token.pageHeight > 0 &&
      token.centerY > token.pageHeight * 0.82 &&
      token.width > token.height * 1.4;
    const isRightEdgeFooterText =
      token.pageWidth > 0 &&
      token.pageHeight > 0 &&
      token.centerX > token.pageWidth * 0.88 &&
      token.centerY > token.pageHeight * 0.26;
    const isFloatingPunctuation =
      token.pageWidth > 0 &&
      token.pageHeight > 0 &&
      /^[。、,.]+$/.test(token.text) &&
      token.centerX > token.pageWidth * 0.7 &&
      token.centerY > token.pageHeight * 0.22;

    return (
      !isStandaloneNoise &&
      !isBottomHorizontalText &&
      !isRightEdgeFooterText &&
      !isFloatingPunctuation
    );
  });
}

function groupVerticalColumns(tokens: PositionedOcrToken[]) {
  const medianWidth = getMedian(tokens.map((token) => token.width));
  const columnThreshold = clamp(medianWidth * 2.4, 18, 72);
  const columns: Array<{
    centerX: number;
    tokens: PositionedOcrToken[];
  }> = [];

  for (const token of [...tokens].sort(
    (first, second) => second.centerX - first.centerX,
  )) {
    const column = columns.find(
      (currentColumn) =>
        Math.abs(currentColumn.centerX - token.centerX) <= columnThreshold,
    );

    if (column) {
      column.tokens.push(token);
      column.centerX =
        column.tokens.reduce(
          (sum, currentToken) => sum + currentToken.centerX,
          0,
        ) /
        column.tokens.length;
      continue;
    }

    columns.push({
      centerX: token.centerX,
      tokens: [token],
    });
  }

  return columns.sort((first, second) => second.centerX - first.centerX);
}

function groupHorizontalRows(tokens: PositionedOcrToken[]) {
  const medianHeight = getMedian(tokens.map((token) => token.height));
  const rowThreshold = clamp(medianHeight * 1.2, 28, 120);
  const rows: Array<{
    centerY: number;
    tokens: PositionedOcrToken[];
  }> = [];

  for (const token of [...tokens].sort(
    (first, second) => first.centerY - second.centerY,
  )) {
    const row = rows.find(
      (currentRow) =>
        Math.abs(currentRow.centerY - token.centerY) <= rowThreshold,
    );

    if (row) {
      row.tokens.push(token);
      row.centerY =
        row.tokens.reduce(
          (sum, currentToken) => sum + currentToken.centerY,
          0,
        ) / row.tokens.length;
      continue;
    }

    rows.push({
      centerY: token.centerY,
      tokens: [token],
    });
  }

  return rows.sort((first, second) => first.centerY - second.centerY);
}

function shouldBuildAsRows(tokens: PositionedOcrToken[]) {
  const wideTokenCount = tokens.filter(
    (token) => token.width > token.height * 1.25,
  ).length;
  const tallTokenCount = tokens.filter(
    (token) => token.height > token.width * 1.25,
  ).length;

  return wideTokenCount >= tallTokenCount;
}

function buildRowBasedText(tokens: PositionedOcrToken[]) {
  return groupHorizontalRows(tokens)
    .map((row) =>
      row.tokens
        .sort((first, second) => first.centerX - second.centerX)
        .map((token) => token.text)
        .join(""),
    )
    .filter(Boolean)
    .join("\n");
}

function buildColumnBasedText(tokens: PositionedOcrToken[]) {
  return groupVerticalColumns(tokens)
    .map((column) =>
      column.tokens
        .sort((first, second) => first.centerY - second.centerY)
        .map((token) => token.text)
        .join(""),
    )
    .filter(Boolean)
    .join("\n");
}

function buildVerticalRightToLeftText(annotation: VisionTextAnnotation) {
  const pageTexts =
    annotation.pages
      ?.map((page) => {
        const tokens = removeVerticalModeNoise(getPageTokens(page));

        return shouldBuildAsRows(tokens)
          ? buildRowBasedText(tokens)
          : buildColumnBasedText(tokens);
      })
      .filter(Boolean) ?? [];

  return pageTexts.join("\n\n").trim();
}

function buildTextFromAnnotation(
  annotation: VisionTextAnnotation,
  readingDirection: OcrReadingDirection,
) {
  const fullText = annotation.text?.trim() ?? "";

  if (readingDirection === "vertical-rl") {
    return buildVerticalRightToLeftText(annotation) || fullText;
  }

  return fullText;
}

/**
 * Google Vision 문서 OCR 결과에서 텍스트를 추출하고, 사용자가 명시한 경우에만 일본어 세로쓰기 순서로 재정렬합니다.
 *
 * @param image - OCR에 사용할 이미지 버퍼입니다.
 * @param languageHints - Google Vision에 전달할 언어 힌트입니다.
 * @param readingDirection - OCR 결과 텍스트 조립에 사용할 읽기 방향입니다. auto는 Google Vision 원문 순서를 유지합니다.
 * @returns 추출 및 보정된 OCR 텍스트를 반환합니다.
 */
export async function extractTextFromImage(
  image: Buffer,
  languageHints: string[],
  readingDirection: OcrReadingDirection = "auto",
) {
  const [result] = await getVisionClient().documentTextDetection({
    image: {
      content: image,
    },
    imageContext: {
      languageHints,
    },
  });
  const annotation = result.fullTextAnnotation as
    | VisionTextAnnotation
    | null
    | undefined;

  if (!annotation) {
    return "";
  }

  return buildTextFromAnnotation(annotation, readingDirection);
}
