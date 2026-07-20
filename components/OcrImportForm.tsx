"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import {
  CurrentNotebookSelector,
  useCurrentNotebookTarget,
} from "@/components/notebooks/CurrentNotebookNotice";
import { getPersistedNotebookId } from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { SentenceSelector } from "@/components/ocr/SentenceSelector";
import { StagedExpressionList } from "@/components/ocr/StagedExpressionList";
import { useOcrImage } from "@/components/ocr/useOcrImage";
import { useStagedExpressions } from "@/components/ocr/useStagedExpressions";
import { buildWordListHref } from "@/components/words/word-list-links";
import { getLanguageOption } from "@/lib/languages";
import { splitTextIntoSentences } from "@/lib/sentence-splitter";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

type OcrImportFormProps = {
  language: Language;
  notebookId?: string;
};

/**
 * OCR 가져오기 화면의 최상위 조립 컴포넌트입니다.
 *
 * @param props - OCR 가져오기 화면에 필요한 속성입니다.
 * @param props.language - OCR 요청, 문장 분리, 저장에 사용할 현재 언어 코드입니다.
 * @param props.notebookId - 저장할 노트 ID입니다.
 * @returns 사진 업로드, 텍스트 추출, 문장 선택, 추가 예정 목록, 단어장 저장 UI를 렌더링합니다.
 */
export function OcrImportForm({ language, notebookId }: OcrImportFormProps) {
  const session = useSession() ?? null;
  const languageOption = getLanguageOption(language);
  const [selectedNotebookId, setSelectedNotebookId] = useState(
    getPersistedNotebookId(notebookId),
  );
  const notebookTarget = useCurrentNotebookTarget({
    language,
    notebookId: selectedNotebookId,
    session,
  });
  const { isLoadingNotebooks, notebooks } = useNotebooksQuery({
    language,
    session,
  });
  const [extractedText, setExtractedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { extractText, imageFile, isExtracting, previewUrl, setImageFile } =
    useOcrImage(language);
  const {
    addExpression,
    clearExpressions,
    enrichmentProgress,
    enrichExpressions,
    isEnrichingExpressions,
    isSavingWords,
    removeExpression,
    saveExpressions,
    stagedExpressions,
    updateExpression,
  } = useStagedExpressions(language, notebookTarget.resolvedNotebookId);
  const sentences = useMemo(
    () => splitTextIntoSentences(extractedText, language),
    [extractedText, language],
  );

  useEffect(() => {
    setSelectedNotebookId(getPersistedNotebookId(notebookId));
  }, [language, notebookId]);

  function handleNotebookChange(nextNotebookId?: string) {
    setSelectedNotebookId(nextNotebookId);

    window.history.replaceState(
      null,
      "",
      buildWordListHref({
        language,
        notebookId: nextNotebookId,
        path: "/words/import",
      }),
    );
  }

  function handleImageFileChange(file?: File) {
    setImageFile(file ?? null);
    setExtractedText("");
    clearExpressions();
    setErrorMessage("");
  }

  async function handleExtractText() {
    setErrorMessage("");

    try {
      const text = await extractText();
      setExtractedText(text);
      clearExpressions();

      if (!text) {
        setErrorMessage("인식된 텍스트가 없습니다. 더 선명한 사진으로 다시 시도해주세요.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "텍스트를 추출하지 못했습니다.",
      );
    }
  }

  function handleAddExpression(term: string, sourceSentence: string) {
    const error = addExpression(term, sourceSentence);
    setErrorMessage(error);
  }

  async function handleEnrichExpressions() {
    setErrorMessage("");
    const error = await enrichExpressions();
    setErrorMessage(error);
  }

  async function handleSaveExpressions() {
    setErrorMessage("");
    const error = await saveExpressions();
    setErrorMessage(error);
  }

  return (
    <>
      <LoadingOverlay
        message={
          isSavingWords
            ? "단어장에 저장하는 중"
            : isEnrichingExpressions
              ? enrichmentProgress
                ? `읽기와 뜻을 채우는 중 ${enrichmentProgress.completed} / ${enrichmentProgress.total}개 완료`
                : "읽기와 뜻을 채우는 중"
              : "사진에서 텍스트를 읽는 중"
        }
        show={isExtracting || isEnrichingExpressions || isSavingWords}
      />
      <section className="grid gap-5">
        <CurrentNotebookSelector
          isLoadingNotebooks={isLoadingNotebooks}
          notebooks={notebooks}
          onNotebookChange={handleNotebookChange}
          selectedNotebookId={selectedNotebookId}
          target={notebookTarget}
        />

        <div className="rounded-lg border border-brand-border bg-white p-4 shadow-sm">
          <p className="text-base font-bold text-brand-text">
            {languageOption.label} 책 사진 올리기
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
                  onChange={(event) =>
                    handleImageFileChange(event.target.files?.[0])
                  }
                  type="file"
                />
              </label>
              <button
                className="min-h-11 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!imageFile || isExtracting}
                onClick={() => void handleExtractText()}
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
          {errorMessage ? (
            <p className="mt-4 rounded-md bg-status-negative-bg px-3 py-2 text-sm font-semibold text-status-negative">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-brand-text">추출된 텍스트</span>
          <textarea
            className="min-h-48 rounded-lg border-brand-border bg-white text-base leading-7"
            onChange={(event) => {
              setExtractedText(event.target.value);
            }}
            placeholder="사진에서 인식된 텍스트가 여기에 표시됩니다."
            value={extractedText}
          />
        </label>

        {sentences.length > 0 ? (
          <SentenceSelector
            key={`${language}:${extractedText}`}
            onAddExpression={handleAddExpression}
            sentences={sentences}
          />
        ) : null}

        {stagedExpressions.length > 0 ? (
          <StagedExpressionList
            expressions={stagedExpressions}
            enrichmentProgress={enrichmentProgress}
            isEnriching={isEnrichingExpressions}
            isSaving={isSavingWords}
            languageOption={languageOption}
            onClear={clearExpressions}
            onEnrich={() => void handleEnrichExpressions()}
            onRemove={removeExpression}
            onSave={() => void handleSaveExpressions()}
            onUpdate={updateExpression}
          />
        ) : null}
      </section>
    </>
  );
}
