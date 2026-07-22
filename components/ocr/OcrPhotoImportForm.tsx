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
import {
  clampZoom,
  extractPhotoLayout,
  joinSelectedText,
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
 * 사진 위 OCR 텍스트 박스를 직접 드래그해 표현을 추가하는 실험형 가져오기 화면입니다.
 *
 * @param props - OCR 요청과 저장에 사용할 언어 및 선택 노트입니다.
 * @param props.language - OCR 언어 힌트와 저장 언어입니다.
 * @param props.notebookId - URL에서 전달된 저장 대상 노트 ID입니다.
 * @returns 사진 위 텍스트 선택, 추가 예정 목록, 읽기/뜻 찾기와 저장 UI를 렌더링합니다.
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
  const [dragState, setDragState] = useState<{
    action: "select" | "deselect";
    startIndex: number;
  } | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(true);
  const [showModeHint, setShowModeHint] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
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
  const selectedTokens = useMemo(
    () => tokens.filter((token) => selectedTokenIds.has(token.id)),
    [selectedTokenIds, tokens],
  );
  const selectedText = useMemo(
    () => joinSelectedText(selectedTokens, language),
    [language, selectedTokens],
  );
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
    function stopDragging() {
      setDragState(null);
      setPanStart(null);
    }

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
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

  function updateSelectedRange(
    startIndex: number,
    endIndex: number,
    action: "select" | "deselect",
  ) {
    const firstIndex = Math.min(startIndex, endIndex);
    const lastIndex = Math.max(startIndex, endIndex);
    const rangeIds = tokens
      .slice(firstIndex, lastIndex + 1)
      .map((token) => token.id);

    setSelectedTokenIds((currentIds) => {
      const nextIds = new Set(currentIds);

      rangeIds.forEach((tokenId) => {
        if (action === "select") {
          nextIds.add(tokenId);
          return;
        }

        nextIds.delete(tokenId);
      });

      return nextIds;
    });
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

    return tokens.findIndex(
      (token) =>
        x >= token.x &&
        x <= token.x + token.width &&
        y >= token.y &&
        y <= token.y + token.height,
    );
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
      setDragState(null);
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
      setDragState(null);
      return;
    }

    const token = tokens[tokenIndex];
    const action = selectedTokenIds.has(token.id) ? "deselect" : "select";
    setDragState({ action, startIndex: tokenIndex });
    updateSelectedRange(tokenIndex, tokenIndex, action);
  }

  function handleImagePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (panStart) {
      updatePan(event);
      return;
    }

    if (!dragState) {
      return;
    }

    const tokenIndex = getTokenIndexAtPointer(event);

    if (tokenIndex < 0) {
      return;
    }

    updateSelectedRange(dragState.startIndex, tokenIndex, dragState.action);
  }

  function handleImagePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (panStart) {
      updatePan(event);
      setPanStart(null);
      return;
    }

    setDragState(null);
  }

  function handleAddSelectedText() {
    const error = addExpression(selectedText, selectedText);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setSelectedTokenIds(new Set());
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
                  사진 속 글자를 형광펜처럼 쓸어 선택한 뒤, 선택한 표현만 추가 예정 목록에 담아보세요.
                </p>
              </div>

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
                  className="min-h-11 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!imageFile || isExtracting}
                  onClick={() => void handleExtractText()}
                  type="button"
                >
                  추출
                </button>
              </div>

              {previewUrl ? (
                <OcrPhotoViewer
                  imageOverlayRef={imageOverlayRef}
                  isSelectMode={isSelectMode}
                  onAddSelectedText={handleAddSelectedText}
                  onClearDrag={() => {
                    setDragState(null);
                    setPanStart(null);
                  }}
                  onClearSelection={() => setSelectedTokenIds(new Set())}
                  onHighlightModeToggle={() =>
                    setIsHighlightMode((current) => !current)
                  }
                  onPointerDown={handleImagePointerDown}
                  onPointerMove={handleImagePointerMove}
                  onPointerUp={handleImagePointerUp}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  panOffset={panOffset}
                  previewUrl={previewUrl}
                  selectedText={selectedText}
                  selectedTokenIds={selectedTokenIds}
                  showModeHint={showModeHint}
                  tokens={tokens}
                  zoomScale={zoomScale}
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
