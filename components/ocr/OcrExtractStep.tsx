import {
  CurrentNotebookSelector,
  type CurrentNotebookTarget,
} from "@/components/notebooks/CurrentNotebookNotice";
import type { Notebook } from "@/types/notebook";
import type { OcrReadingDirection } from "@/types/ocr";
import { readingDirectionOptions } from "@/components/ocr/ocr-import-steps";

type OcrExtractStepProps = {
  canSelectExpressions: boolean;
  extractedText: string;
  imageFile: File | null;
  isExtracting: boolean;
  isLoadingNotebooks: boolean;
  languageLabel: string;
  notebooks: Notebook[];
  onExtractText: () => void;
  onExtractedTextChange: (text: string) => void;
  onImageFileChange: (file?: File) => void;
  onNext: () => void;
  onNotebookChange: (notebookId?: string) => void;
  onReadingDirectionChange: (direction: OcrReadingDirection) => void;
  previewUrl: string | null;
  readingDirection: OcrReadingDirection;
  selectedNotebookId?: string;
  shouldShowReadingDirection: boolean;
  target: CurrentNotebookTarget;
};

/**
 * OCR 가져오기 첫 단계인 사진 선택, 텍스트 추출, 추출 텍스트 수정을 렌더링합니다.
 *
 * @param props - 노트 선택, 이미지 선택, OCR 추출, 텍스트 수정에 필요한 상태와 콜백입니다.
 * @returns 사진/텍스트 추출 단계 UI를 렌더링합니다.
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
  onExtractedTextChange,
  onImageFileChange,
  onNext,
  onNotebookChange,
  onReadingDirectionChange,
  previewUrl,
  readingDirection,
  selectedNotebookId,
  shouldShowReadingDirection,
  target,
}: OcrExtractStepProps) {
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
          {shouldShowReadingDirection ? (
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-brand-text">
                읽기 방향
              </span>
              <div className="grid grid-cols-3 rounded-full bg-brand-background p-1 shadow-sm">
                {readingDirectionOptions.map((option) => (
                  <button
                    aria-pressed={readingDirection === option.value}
                    className={`min-h-8 rounded-full px-2 text-xs font-bold ${
                      readingDirection === option.value
                        ? "bg-primary text-white shadow-sm"
                        : "text-brand-muted"
                    }`}
                    key={option.value}
                    onClick={() => onReadingDirectionChange(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-bold text-brand-text">추출된 텍스트</span>
        <textarea
          className="min-h-48 rounded-lg border-brand-border bg-white text-base leading-7"
          onChange={(event) => onExtractedTextChange(event.target.value)}
          placeholder="사진에서 인식된 텍스트가 여기에 표시됩니다."
          value={extractedText}
        />
      </label>

      <button
        className="min-h-12 rounded-lg bg-primary px-4 text-base font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
        disabled={!canSelectExpressions}
        onClick={onNext}
        type="button"
      >
        문장에서 표현 고르기
      </button>
    </section>
  );
}
