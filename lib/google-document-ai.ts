import { DocumentProcessorServiceClient, protos } from "@google-cloud/documentai";
import { getGoogleCloudCredentials } from "@/lib/google-cloud-credentials";
import type { OcrExtractionResult, OcrTextBox } from "@/types/ocr";

type Document = protos.google.cloud.documentai.v1.IDocument;
type TextAnchor = protos.google.cloud.documentai.v1.Document.ITextAnchor;
type Token = protos.google.cloud.documentai.v1.Document.Page.IToken;

let documentAiClient: DocumentProcessorServiceClient | undefined;

const sentenceEndPattern = /[。！？!?．.](?:[”"’'」』）)\]】〕〉》]*)$/u;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function toNumber(value: number | string | object | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return Number(value?.toString() ?? 0);
}

function getTextRange(anchor?: TextAnchor | null) {
  const segment = anchor?.textSegments?.[0];

  return {
    end: toNumber(segment?.endIndex),
    start: toNumber(segment?.startIndex),
  };
}

function getAnchorText(documentText: string, anchor?: TextAnchor | null) {
  if (anchor?.content) {
    return anchor.content.trim();
  }

  const range = getTextRange(anchor);
  return documentText.slice(range.start, range.end).trim();
}

function getTokenBox(token: Token) {
  const normalizedVertices = token.layout?.boundingPoly?.normalizedVertices;

  if (!normalizedVertices || normalizedVertices.length === 0) {
    return null;
  }

  const xs = normalizedVertices.map((vertex) => vertex.x ?? 0);
  const ys = normalizedVertices.map((vertex) => vertex.y ?? 0);
  const x = clamp(Math.min(...xs));
  const y = clamp(Math.min(...ys));
  const right = clamp(Math.max(...xs));
  const bottom = clamp(Math.max(...ys));

  return {
    height: bottom - y,
    width: right - x,
    x,
    y,
  };
}

function isLikelyPageNumber(token: OcrTextBox) {
  const isPageEdge = token.y < 0.15 || token.y + token.height > 0.88;

  return isPageEdge && /^\d{1,4}$/u.test(token.text);
}

function getDocumentTokens(document: Document) {
  const documentText = document.text ?? "";
  let readingOrder = 0;

  return (document.pages ?? []).flatMap((page, pageIndex) => {
    let sentenceIndex = 0;
    const pageTokens = [...(page.tokens ?? [])].sort(
      (first, second) =>
        getTextRange(first.layout?.textAnchor).start -
        getTextRange(second.layout?.textAnchor).start,
    );

    return pageTokens.flatMap((token) => {
      const text = getAnchorText(documentText, token.layout?.textAnchor);
      const box = getTokenBox(token);

      if (!text || !box || box.width <= 0 || box.height <= 0) {
        return [];
      }

      const textBox: OcrTextBox = {
        ...box,
        id: `document-ai:${pageIndex}:${readingOrder}`,
        pageIndex,
        readingOrder,
        sentenceId: `document-ai:${pageIndex}:${sentenceIndex}`,
        text,
      };
      readingOrder += 1;

      if (sentenceEndPattern.test(text)) {
        sentenceIndex += 1;
      }

      return isLikelyPageNumber(textBox) ? [] : [textBox];
    });
  });
}

function getDocumentAiConfig() {
  const credentials = getGoogleCloudCredentials();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ?? credentials?.project_id;
  const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
  const location = process.env.GOOGLE_DOCUMENT_AI_LOCATION ?? "us";

  if (!projectId || !processorId) {
    throw new Error(
      "Document AI 프로젝트 또는 프로세서 환경변수가 설정되지 않았습니다.",
    );
  }

  return { credentials, location, processorId, projectId };
}

function getDocumentAiClient(
  location: string,
  credentials: ReturnType<typeof getGoogleCloudCredentials>,
) {
  if (documentAiClient) {
    return documentAiClient;
  }

  documentAiClient = new DocumentProcessorServiceClient({
    apiEndpoint: `${location}-documentai.googleapis.com`,
    credentials,
  });

  return documentAiClient;
}

/**
 * Document AI Enterprise OCR로 사진의 텍스트와 서버가 판단한 읽기 순서 좌표를 추출합니다.
 *
 * @param image - OCR에 사용할 이미지 버퍼입니다.
 * @param mimeType - Document AI에 전달할 이미지 MIME 타입입니다.
 * @param languageHints - 문서에서 예상되는 BCP-47 언어 코드입니다.
 * @returns 전체 OCR 텍스트와 읽기 순서가 포함된 사진 위 토큰 목록을 반환합니다.
 */
export async function extractDocumentAiResult(
  image: Buffer,
  mimeType: string,
  languageHints: string[],
): Promise<OcrExtractionResult> {
  const { credentials, location, processorId, projectId } =
    getDocumentAiConfig();
  const client = getDocumentAiClient(location, credentials);
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
  const [result] = await client.processDocument({
    name,
    processOptions: {
      ocrConfig: {
        hints: {
          languageHints,
        },
      },
    },
    rawDocument: {
      content: image.toString("base64"),
      mimeType,
    },
    skipHumanReview: true,
  });
  const document = result.document;

  if (!document) {
    return { text: "", tokens: [] };
  }

  return {
    text: document.text?.trim() ?? "",
    tokens: getDocumentTokens(document),
  };
}
