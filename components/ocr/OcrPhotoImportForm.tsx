"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import {
  CurrentNotebookSelector,
  useCurrentNotebookTarget,
} from "@/components/notebooks/CurrentNotebookNotice";
import { getPersistedNotebookId } from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { OcrPhotoQueue } from "@/components/ocr/OcrPhotoQueue";
import { OcrPhotoSaveStep } from "@/components/ocr/OcrPhotoSaveStep";
import { OcrPhotoViewer } from "@/components/ocr/OcrPhotoViewer";
import { SentenceSelector } from "@/components/ocr/SentenceSelector";
import {
  clampZoom,
  extractPhotoLayout,
  getHighlightRegions,
  getTextViewportBounds,
  joinSelectedText,
  orderOcrTokens,
} from "@/components/ocr/ocr-photo-utils";
import { useStagedExpressions } from "@/components/ocr/useStagedExpressions";
import { buildWordListHref } from "@/components/words/word-list-links";
import { getLanguageOption } from "@/lib/languages";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { OcrTextBox } from "@/types/ocr";

type OcrPhotoImportFormProps = {
  language: Language;
  notebookId?: string;
};

/**
 * 사진에서 문장을 탭하고 해당 문장 텍스트에서 여러 표현을 추가하는 실험형 가져오기 화면입니다.
 *
 * @param props - OCR 요청과 저장에 사용할 언어 및 선택 노트입니다.
 * @param props.language - OCR 언어 힌트와 저장 언어입니다.
 * @param props.notebookId - URL에서 전달된 저장 대상 노트 ID입니다.
 * @returns 사진 위 문장 선택, 추가 예정 목록, 읽기/뜻 찾기와 저장 UI를 렌더링합니다.
 */
export function OcrPhotoImportForm({
  language,
  notebookId,
}: OcrPhotoImportFormProps) {
  const session = useSession() ?? null;
  const languageOption = getLanguageOption(language);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tokens, setTokens] = useState<OcrTextBox[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState(
    getPersistedNotebookId(notebookId),
  );
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(true);
  const [isTextFitEnabled, setIsTextFitEnabled] = useState(true);
  const [showModeHint, setShowModeHint] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageOverlayRef = useRef<HTMLDivElement | null>(null);
  const notebookTarget = useCurrentNotebookTarget({
    language,
    notebookId: selectedNotebookId,
    session,
  });
  const { isLoadingNotebooks, notebooks } = useNotebooksQuery({
    language,
    session,
  });
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
  const orderedTokens = useMemo(() => orderOcrTokens(tokens), [tokens]);
  const selectedTokens = useMemo(
    () => orderedTokens.filter((token) => selectedTokenIds.has(token.id)),
    [orderedTokens, selectedTokenIds],
  );
  const selectedText = useMemo(
    () => joinSelectedText(selectedTokens, language),
    [language, selectedTokens],
  );
  const highlightRegions = useMemo(
    () => getHighlightRegions(orderedTokens),
    [orderedTokens],
  );
  const textViewportBounds = useMemo(
    () => getTextViewportBounds(orderedTokens),
    [orderedTokens],
  );
  const hasExtractedLayout = tokens.length > 0;
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );
  const isSelectMode = zoomScale <= 1 || isHighlightMode;

  function scrollToTop() {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
    });
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    function stopPointerInteraction() {
      setPanStart(null);
    }

    window.addEventListener("pointerup", stopPointerInteraction);
    window.addEventListener("pointercancel", stopPointerInteraction);

    return () => {
      window.removeEventListener("pointerup", stopPointerInteraction);
      window.removeEventListener("pointercancel", stopPointerInteraction);
    };
  }, []);

  useEffect(() => {
    if (!showModeHint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowModeHint(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showModeHint]);

  function selectSentence(tokenIndex: number) {
    const sentenceId = tokens[tokenIndex]?.sentenceId;

    if (!sentenceId) {
      return;
    }

    setSelectedTokenIds(
      new Set(
        orderedTokens
          .filter((token) => token.sentenceId === sentenceId)
          .map((token) => token.id),
      ),
    );
    setErrorMessage("");
  }

  function handleNotebookChange(nextNotebookId?: string) {
    setSelectedNotebookId(nextNotebookId);

    window.history.replaceState(
      null,
      "",
      buildWordListHref({
        language,
        notebookId: nextNotebookId,
        path: "/words/import/photo",
      }),
    );
  }

  function handleImageFileChange(file?: File) {
    setImageFile(file ?? null);
    setTokens([]);
    setExtractedText("");
    setSelectedTokenIds(new Set());
    clearExpressions();
    setShowSaveForm(false);
    setIsHighlightMode(true);
    setIsTextFitEnabled(true);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1);
    setErrorMessage("");
  }

  async function handleExtractText() {
    if (!imageFile) {
      setErrorMessage("사진을 먼저 선택해주세요.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage("");
    setSelectedTokenIds(new Set());
    setIsTextFitEnabled(true);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1);

    try {
      const result = await extractPhotoLayout(imageFile, language);
      setExtractedText(result.text);
      setTokens(result.tokens);

      if (result.tokens.length === 0) {
        setErrorMessage("사진 위에서 선택할 텍스트 영역을 찾지 못했습니다.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "사진에서 텍스트를 추출하지 못했습니다.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function getTokenIndexAtPointer(event: PointerEvent<HTMLDivElement>) {
    const overlay = imageOverlayRef.current;

    if (!overlay) {
      return -1;
    }

    const rect = overlay.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const tokenIndex = tokens.findIndex(
      (token) =>
        x >= token.x &&
        x <= token.x + token.width &&
        y >= token.y &&
        y <= token.y + token.height,
    );

    if (tokenIndex >= 0) {
      return tokenIndex;
    }

    const region = highlightRegions.find(
      (highlightRegion) =>
        x >= highlightRegion.x &&
        x <= highlightRegion.x + highlightRegion.width &&
        y >= highlightRegion.y &&
        y <= highlightRegion.y + highlightRegion.height,
    );

    return region
      ? tokens.findIndex((token) => token.sentenceId === region.sentenceId)
      : -1;
  }

  function handleZoomIn() {
    setZoomScale((currentScale) => {
      const nextScale = clampZoom(currentScale + 0.5);

      if (currentScale <= 1 && nextScale > 1) {
        setIsHighlightMode(false);
        setShowModeHint(true);
      }

      return nextScale;
    });
  }

  function handleZoomOut() {
    setZoomScale((currentScale) => {
      const nextScale = clampZoom(currentScale - 0.5);

      if (nextScale <= 1) {
        setIsHighlightMode(true);
        setPanOffset({ x: 0, y: 0 });
      }

      return nextScale;
    });
  }

  function handleTextFitToggle() {
    setIsTextFitEnabled((current) => !current);
    setIsHighlightMode(true);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1);
  }

  function updatePan(event: PointerEvent<HTMLDivElement>) {
    if (!panStart) {
      return;
    }

    setPanOffset({
      x: panStart.x + event.clientX - panStart.clientX,
      y: panStart.y + event.clientY - panStart.clientY,
    });
  }

  function handleImagePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (!isSelectMode) {
      setPanStart({
        clientX: event.clientX,
        clientY: event.clientY,
        x: panOffset.x,
        y: panOffset.y,
      });
      return;
    }

    const tokenIndex = getTokenIndexAtPointer(event);

    if (tokenIndex < 0) {
      return;
    }

    selectSentence(tokenIndex);
  }

  function handleImagePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (panStart) {
      updatePan(event);
      return;
    }

  }

  function handleImagePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (panStart) {
      updatePan(event);
      setPanStart(null);
      return;
    }

  }

  function handleAddExpression(term: string, sourceSentence: string) {
    const error = addExpression(term, sourceSentence);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setShowSaveForm(false);
    setErrorMessage("");
  }

  function handleClearExpressions() {
    clearExpressions();
    setShowSaveForm(false);
  }

  function handleRemoveExpression(expressionId: string) {
    removeExpression(expressionId);

    if (stagedExpressions.length <= 1) {
      setShowSaveForm(false);
    }
  }

  function handleShowSaveForm() {
    setShowSaveForm(true);
    scrollToTop();
  }

  function handleBackToSelection() {
    setShowSaveForm(false);
    scrollToTop();
  }

  async function handleEnrichExpressions() {
    setErrorMessage("");
    const error = await enrichExpressions();

    if (error) {
      setErrorMessage(error);
    }
  }

  async function handleSaveExpressions() {
    setErrorMessage("");
    const error = await saveExpressions();

    if (error) {
      setErrorMessage(error);
    }
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
              : "사진에서 텍스트 위치를 찾는 중"
        }
        show={isExtracting || isEnrichingExpressions || isSavingWords}
      />

      <section className="grid gap-5">
        {errorMessage ? (
          <p className="rounded-md bg-status-negative-bg px-3 py-2 text-sm font-semibold text-status-negative">
            {errorMessage}
          </p>
        ) : null}

        {!showSaveForm ? (
          <>
            <CurrentNotebookSelector
              isLoadingNotebooks={isLoadingNotebooks}
              notebooks={notebooks}
              onNotebookChange={handleNotebookChange}
              selectedNotebookId={selectedNotebookId}
              target={notebookTarget}
            />

            <section className="grid gap-4 rounded-lg border border-brand-border bg-white p-4 shadow-sm">
              <div>
                <p className="text-base font-black text-brand-text">
                  사진 위에서 고르기
                </p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  모르는 단어가 있는 문장을 탭한 뒤, 아래 텍스트에서 여러 표현을 골라보세요.
                </p>
              </div>

              <input
                accept="image/*"
        className="hidden"
                onChange={(event) => {
                  handleImageFileChange(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />

              {!hasExtractedLayout ? (
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <button
                    className="grid min-h-11 place-items-center rounded-lg border border-brand-border bg-white px-3 text-sm font-bold text-brand-text"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    {imageFile ? "사진 재선택" : "사진 선택"}
                  </button>
                  <button
                    className="min-h-11 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!imageFile || isExtracting}
                    onClick={() => void handleExtractText()}
                    type="button"
                  >
                    추출
                  </button>
                </div>
              ) : null}

              {previewUrl ? (
                <OcrPhotoViewer
                  imageOverlayRef={imageOverlayRef}
                  highlightRegions={highlightRegions}
                  isSelectMode={isSelectMode}
                  isTextFitEnabled={isTextFitEnabled}
                  onClearInteraction={() => setPanStart(null)}
                  onHighlightModeToggle={() =>
                    setIsHighlightMode((current) => !current)
                  }
                  onReselectImage={() => fileInputRef.current?.click()}
                  onTextFitToggle={handleTextFitToggle}
                  onPointerDown={handleImagePointerDown}
                  onPointerMove={handleImagePointerMove}
                  onPointerUp={handleImagePointerUp}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  panOffset={panOffset}
                  previewUrl={previewUrl}
                  selectedTokenIds={selectedTokenIds}
                  showModeHint={showModeHint}
                  textViewportBounds={textViewportBounds}
                  zoomScale={zoomScale}
                />
              ) : null}

              {selectedText ? (
                <SentenceSelector
                  key={selectedText}
                  onAddExpression={handleAddExpression}
                  sentences={[selectedText]}
                />
              ) : null}

              {extractedText && tokens.length === 0 ? (
                <p className="rounded-lg bg-brand-background px-3 py-2 text-sm font-semibold leading-6 text-brand-muted">
                  텍스트는 추출됐지만 사진 위 선택 영역은 만들지 못했습니다. 기존 문장 확인 방식으로 가져오기를 시도해주세요.
                </p>
              ) : null}
            </section>

            <OcrPhotoQueue
              expressions={stagedExpressions}
              onNext={handleShowSaveForm}
              onRemove={handleRemoveExpression}
            />
          </>
        ) : null}

        {showSaveForm ? (
          <OcrPhotoSaveStep
            enrichmentProgress={enrichmentProgress}
            expressions={stagedExpressions}
            isEnriching={isEnrichingExpressions}
            isSaving={isSavingWords}
            languageOption={languageOption}
            onBack={handleBackToSelection}
            onClear={handleClearExpressions}
            onEnrich={() => void handleEnrichExpressions()}
            onRemove={handleRemoveExpression}
            onSave={() => void handleSaveExpressions()}
            onUpdate={updateExpression}
          />
        ) : null}
      </section>
    </>
  );
}
