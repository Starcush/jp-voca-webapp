"use client";

import {
  OcrPhotoImportForm,
} from "@/components/ocr/OcrPhotoImportForm";
import type { OcrImportMode } from "@/components/ocr/types";
import type { Language } from "@/types/language";

type OcrImportFormProps = {
  initialMode?: OcrImportMode;
  language: Language;
  notebookId?: string;
};

/**
 * 공통 사진과 Document AI 결과를 공유하는 통합 OCR 가져오기 화면입니다.
 *
 * @param props - 초기 선택 방식, OCR 언어, 저장 노트입니다.
 * @returns 문장별 선택과 사진 위 선택을 탭으로 전환하는 가져오기 UI를 렌더링합니다.
 */
export function OcrImportForm({
  initialMode,
  language,
  notebookId,
}: OcrImportFormProps) {
  return (
    <OcrPhotoImportForm
      initialMode={initialMode}
      language={language}
      notebookId={notebookId}
    />
  );
}
