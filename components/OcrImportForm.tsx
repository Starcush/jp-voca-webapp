"use client";

import { useMemo } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useCurrentNotebookTarget } from "@/components/notebooks/CurrentNotebookNotice";
import { getPersistedNotebookId } from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { OcrConfirmStep } from "@/components/ocr/OcrConfirmStep";
import { OcrExtractStep } from "@/components/ocr/OcrExtractStep";
import { OcrSelectStep } from "@/components/ocr/OcrSelectStep";
import { OcrStepProgress } from "@/components/ocr/OcrStepProgress";
import {
  canUseOcrImportStep,
  getResolvedOcrImportStep,
  type OcrImportStep,
} from "@/components/ocr/ocr-import-steps";
import { useOcrImage } from "@/components/ocr/useOcrImage";
import { useOcrImportState } from "@/components/ocr/useOcrImportState";
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
  const {
    activeStep,
    clearErrorMessage,
    completeExtraction,
    errorMessage,
    extractedText,
    readingDirection,
    resetForImage,
    selectedNotebookId,
    setActiveStep,
    setErrorMessage,
    setExtractedText,
    setReadingDirection,
    setSelectedNotebookId,
  } = useOcrImportState(getPersistedNotebookId(notebookId));
  const notebookTarget = useCurrentNotebookTarget({
    language,
    notebookId: selectedNotebookId,
    session,
  });
  const { isLoadingNotebooks, notebooks } = useNotebooksQuery({
    language,
    session,
  });
  const { extractText, imageFile, isExtracting, previewUrl, setImageFile } =
    useOcrImage(language, readingDirection);
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
  const canSelectExpressions = sentences.length > 0;
  const canConfirmExpressions = stagedExpressions.length > 0;
  const resolvedActiveStep = getResolvedOcrImportStep({
    activeStep,
    canConfirmExpressions,
    canSelectExpressions,
  });

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
    clearExpressions();
    resetForImage();
  }

  async function handleExtractText() {
    clearErrorMessage();

    try {
      const text = await extractText();
      completeExtraction(text);
      clearExpressions();

      if (!text) {
        setErrorMessage("인식된 텍스트가 없습니다. 더 선명한 사진으로 다시 시도해주세요.");
        return;
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
    if (error) {
      setErrorMessage(error);
      return;
    }

    clearErrorMessage();
  }

  async function handleEnrichExpressions() {
    clearErrorMessage();
    const error = await enrichExpressions();
    if (error) {
      setErrorMessage(error);
    }
  }

  async function handleSaveExpressions() {
    clearErrorMessage();
    const error = await saveExpressions();
    if (error) {
      setErrorMessage(error);
    }
  }

  function handleStepChange(nextStep: OcrImportStep) {
    if (!canUseOcrImportStep(nextStep, {
      canConfirmExpressions,
      canSelectExpressions,
    })) {
      return;
    }

    clearErrorMessage();
    setActiveStep(nextStep);
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
        <OcrStepProgress
          activeStep={resolvedActiveStep}
          canConfirmExpressions={canConfirmExpressions}
          canSelectExpressions={canSelectExpressions}
          onStepChange={handleStepChange}
          stagedExpressionCount={stagedExpressions.length}
        />

        {errorMessage ? (
          <p className="rounded-md bg-status-negative-bg px-3 py-2 text-sm font-semibold text-status-negative">
            {errorMessage}
          </p>
        ) : null}

        {resolvedActiveStep === "extract" ? (
          <OcrExtractStep
            canSelectExpressions={canSelectExpressions}
            extractedText={extractedText}
            imageFile={imageFile}
            isExtracting={isExtracting}
            isLoadingNotebooks={isLoadingNotebooks}
            languageLabel={languageOption.label}
            notebooks={notebooks}
            onExtractText={() => void handleExtractText()}
            onExtractedTextChange={setExtractedText}
            onImageFileChange={handleImageFileChange}
            onNext={() => handleStepChange("select")}
            onNotebookChange={handleNotebookChange}
            onReadingDirectionChange={setReadingDirection}
            previewUrl={previewUrl}
            readingDirection={readingDirection}
            selectedNotebookId={selectedNotebookId}
            shouldShowReadingDirection={language === "ja"}
            target={notebookTarget}
          />
        ) : null}

        {resolvedActiveStep === "select" ? (
          <OcrSelectStep
            canConfirmExpressions={canConfirmExpressions}
            extractedText={extractedText}
            language={language}
            onAddExpression={handleAddExpression}
            onBack={() => handleStepChange("extract")}
            onConfirm={() => handleStepChange("confirm")}
            sentences={sentences}
            stagedExpressions={stagedExpressions}
            stagedExpressionCount={stagedExpressions.length}
          />
        ) : null}

        {resolvedActiveStep === "confirm" ? (
          <OcrConfirmStep
            expressions={stagedExpressions}
            enrichmentProgress={enrichmentProgress}
            isEnriching={isEnrichingExpressions}
            isSaving={isSavingWords}
            languageOption={languageOption}
            onBack={() => handleStepChange("select")}
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
