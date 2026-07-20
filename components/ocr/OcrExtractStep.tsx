import {
  CurrentNotebookSelector,
  type CurrentNotebookTarget,
} from "@/components/notebooks/CurrentNotebookNotice";
import { ChevronRight } from "lucide-react";
import type { Notebook } from "@/types/notebook";

type OcrExtractStepProps = {
  canSelectExpressions: boolean;
  extractedText: string;
  imageFile: File | null;
  isExtracting: boolean;
  isLoadingNotebooks: boolean;
  languageLabel: string;
  notebooks: Notebook[];
  onExtractText: () => void;
  onImageFileChange: (file?: File) => void;
  onNext: () => void;
  onNotebookChange: (notebookId?: string) => void;
  previewUrl: string | null;
  selectedNotebookId?: string;
  sentenceCount: number;
  target: CurrentNotebookTarget;
};

/**
 * OCR 가져오기 첫 단계인 사진 선택, 텍스트 추출, 추출 텍스트 수정을 렌더링합니다.
 *
 * @param props - 노트 선택, 이미지 선택, OCR 추출, 추출 결과 확인에 필요한 상태와 콜백입니다.
 * @returns 사진 선택, OCR 추출, 추출 결과 요약 UI를 렌더링합니다.
 */
export function OcrExtractStep({
  canSelectExpressions,
  extractedText,
  imageFile,
  isExtracting,
  isLoadingNotebooks,
  languageLabel,
  notebooks,
  onExtractText,
  onImageFileChange,
  onNext,
  onNotebookChange,
  previewUrl,
  selectedNotebookId,
  sentenceCount,
  target,
}: OcrExtractStepProps) {
  const hasExtractedText = extractedText.trim().length > 0;

  return (
    <section className="grid gap-5">
      <CurrentNotebookSelector
        isLoadingNotebooks={isLoadingNotebooks}
        notebooks={notebooks}
        onNotebookChange={onNotebookChange}
        selectedNotebookId={selectedNotebookId}
        target={target}
      />

      <div className="rounded-lg border border-brand-border bg-white p-4 shadow-sm">
        <p className="text-base font-bold text-brand-text">
          {languageLabel} 책 사진 올리기
        </p>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          사진에서 텍스트를 추출한 뒤, 문장별로 모르는 단어와 문법 표현을 선택해 단어장에 추가할 수 있습니다.
        </p>
        <div className="mt-4 grid gap-2">
          <span className="text-sm font-semibold text-brand-text">사진</span>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="grid min-h-11 cursor-pointer place-items-center rounded-lg border border-brand-border bg-white px-3 text-sm font-bold text-brand-text">
              사진 선택
              <input
                accept="image/*"
                className="sr-only"
                onChange={(event) => onImageFileChange(event.target.files?.[0])}
                type="file"
              />
            </label>
            <button
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!imageFile || isExtracting}
              onClick={onExtractText}
              type="button"
            >
              추출
            </button>
          </div>
          {imageFile ? (
            <p className="text-xs font-semibold text-brand-muted">
              선택됨: {imageFile.name}
            </p>
          ) : null}
        </div>
        {previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-brand-border bg-brand-background">
            {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews are not served through Next image optimization. */}
            <img
              alt="OCR 미리보기"
              className="max-h-80 w-full object-contain"
              src={previewUrl}
            />
          </div>
        ) : null}
        {hasExtractedText ? (
          <section className="mt-4 grid gap-3 rounded-lg border border-primary/20 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-brand-text">
                  텍스트를 추출했어요
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-muted">
                  문장 {sentenceCount}개를 확인할 수 있습니다.
                </p>
              </div>
              <button
                className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
                disabled={!canSelectExpressions}
                onClick={onNext}
                type="button"
              >
                <span>문장 확인</span>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
