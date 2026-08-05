import { SentenceSelector } from "@/components/ocr/SentenceSelector";
import type { Language } from "@/types/language";

type OcrSentenceModeProps = {
  imageName?: string;
  language: Language;
  onAddExpression: (term: string, sourceSentence: string) => void;
  onReselectImage: () => void;
  onUpdateSentence: (index: number, sentence: string) => void;
  sentences: string[];
};

/**
 * 추출된 문장을 하나씩 수정하고 표현을 선택하는 문장별 모드입니다.
 *
 * @param props - 문장 목록, 사진 이름, 표현 추가와 문장 수정 콜백입니다.
 * @returns 사진 재선택 요약과 문장별 표현 선택 UI를 렌더링합니다.
 */
export function OcrSentenceMode({
  imageName,
  language,
  onAddExpression,
  onReselectImage,
  onUpdateSentence,
  sentences,
}: OcrSentenceModeProps) {
  if (sentences.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-background px-3 py-2">
        <p className="min-w-0 truncate text-xs font-semibold text-brand-muted">
          {imageName}
        </p>
        <button
          className="shrink-0 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-black text-brand-text"
          onClick={onReselectImage}
          type="button"
        >
          사진 재선택
        </button>
      </div>
      <SentenceSelector
        key={`${language}:sentence`}
        language={language}
        onAddExpression={onAddExpression}
        onUpdateSentence={onUpdateSentence}
        sentences={sentences}
      />
    </>
  );
}
