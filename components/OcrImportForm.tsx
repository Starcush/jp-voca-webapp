"use client";

import { useMemo, useState } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { SentenceSelector } from "@/components/ocr/SentenceSelector";
import { StagedExpressionList } from "@/components/ocr/StagedExpressionList";
import { useOcrImage } from "@/components/ocr/useOcrImage";
import { useStagedExpressions } from "@/components/ocr/useStagedExpressions";
import { getLanguageOption } from "@/lib/languages";
import { splitTextIntoSentences } from "@/lib/sentence-splitter";
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
  const languageOption = getLanguageOption(language);
  const [extractedText, setExtractedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { extractText, imageFile, isExtracting, previewUrl, setImageFile } =
    useOcrImage(language);
  const {
    addExpression,
    clearExpressions,
    enrichExpressions,
    isEnrichingExpressions,
    isSavingWords,
    removeExpression,
    saveExpressions,
    stagedExpressions,
    updateExpression,
  } = useStagedExpressions(language, notebookId);
  const sentences = useMemo(
    () => splitTextIntoSentences(extractedText, language),
    [extractedText, language],
  );

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
              ? "읽기와 뜻을 찾는 중"
              : "사진에서 텍스트를 읽는 중"
        }
        show={isExtracting || isEnrichingExpressions || isSavingWords}
      />
      <section className="grid gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-base font-bold text-slate-950">
            {languageOption.label} 책 사진 올리기
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            사진에서 텍스트를 추출한 뒤, 문장별로 모르는 단어와 문법 표현을 선택해 단어장에 추가할 수 있습니다.
          </p>
          <div className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">사진</span>
            <label className="grid min-h-11 cursor-pointer place-items-center rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">
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
            {imageFile ? (
              <p className="text-xs font-semibold text-slate-500">
                선택됨: {imageFile.name}
              </p>
            ) : null}
          </div>
          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews are not served through Next image optimization. */}
              <img
                alt="OCR 미리보기"
                className="max-h-80 w-full object-contain"
                src={previewUrl}
              />
            </div>
          ) : null}
          {errorMessage ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <button
            className="mt-4 min-h-12 w-full rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!imageFile || isExtracting}
            onClick={() => void handleExtractText()}
            type="button"
          >
            텍스트 추출
          </button>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-700">추출된 텍스트</span>
          <textarea
            className="min-h-64 rounded-lg border-slate-200 bg-white text-base leading-7"
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
