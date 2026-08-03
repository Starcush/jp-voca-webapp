import { useQuery } from "@tanstack/react-query";
import type { Language } from "@/types/language";

type TextSegment = {
  isWord: boolean;
  text: string;
};

type TextSegmentsResponse = {
  segments: TextSegment[];
};

async function fetchTextSegments(language: Language, text: string) {
  const response = await fetch("/api/text-segments", {
    body: JSON.stringify({ language, text }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("문장의 단어 경계를 찾지 못했습니다.");
  }

  return (await response.json()) as TextSegmentsResponse;
}

/**
 * OCR 문장에서 한 번의 탭으로 선택할 단어 경계를 조회합니다.
 *
 * @param language - 문장에 적용할 언어별 단어 분리 방식입니다.
 * @param text - 현재 화면에 표시된 OCR 문장입니다.
 * @returns 단어 경계 조회 결과와 로딩/오류 상태를 포함한 TanStack Query입니다.
 */
export function useTextSegmentsQuery(language: Language, text: string) {
  return useQuery({
    enabled: Boolean(text.trim()),
    queryFn: () => fetchTextSegments(language, text),
    queryKey: ["ocr", "text-segments", language, text],
    staleTime: Number.POSITIVE_INFINITY,
  });
}
