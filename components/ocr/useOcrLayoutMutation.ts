"use client";

import { useMutation } from "@tanstack/react-query";
import { extractPhotoLayout } from "@/components/ocr/ocr-photo-utils";
import type { Language } from "@/types/language";

type OcrLayoutInput = {
  imageFile: File;
  language: Language;
};

/**
 * 사용자가 선택한 사진을 Document AI로 분석하는 요청 상태를 관리합니다.
 *
 * @returns 사진과 언어를 받아 레이아웃 OCR을 실행하는 TanStack Query mutation을 반환합니다.
 */
export function useOcrLayoutMutation() {
  return useMutation({
    mutationFn: ({ imageFile, language }: OcrLayoutInput) =>
      extractPhotoLayout(imageFile, language),
  });
}
