"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Highlighter } from "lucide-react";
import { useTextSegmentsQuery } from "@/components/ocr/useTextSegmentsQuery";
import type { Language } from "@/types/language";

type SentenceSelectorProps = {
  language: Language;
  onAddExpression: (term: string, sourceSentence: string) => void;
  sentences: string[];
};

type SegmentRange = {
  end: number;
  start: number;
};

function normalizeSelectedText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * OCR 텍스트를 문장 단위로 넘기며 사용자가 단어/표현을 선택하는 컴포넌트입니다.
 *
 * @param props - 문장 선택 UI에 필요한 속성입니다.
 * @param props.language - 탭할 단어의 경계를 판별할 문장 언어입니다.
 * @param props.sentences - OCR 원문에서 분리된 문장 목록입니다.
 * @param props.onAddExpression - 사용자가 선택한 표현과 원문 문장을 부모로 전달하는 콜백입니다.
 * @returns 현재 문장, 선택한 텍스트, 표현 추가 버튼, 이전/다음 문장 이동 UI를 렌더링합니다.
 */
export function SentenceSelector({
  language,
  onAddExpression,
  sentences,
}: SentenceSelectorProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedSegmentRange, setSelectedSegmentRange] =
    useState<SegmentRange | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const sentenceRef = useRef<HTMLDivElement>(null);
  const isPointerSelectingRef = useRef(false);
  const selectionFrameRef = useRef<number | null>(null);
  const selectionTimeoutRefs = useRef<number[]>([]);
  const lastSentenceIndex = Math.max(sentences.length - 1, 0);
  const activeSentenceIndex = Math.min(currentSentenceIndex, lastSentenceIndex);
  const currentSentence = sentences[activeSentenceIndex] ?? "";
  const segmentsQuery = useTextSegmentsQuery(language, currentSentence);
  const segments = useMemo(
    () => segmentsQuery.data?.segments ?? [],
    [segmentsQuery.data?.segments],
  );

  const selectedWordIndexes = selectedSegmentRange
    ? segments
        .map((segment, index) => (segment.isWord ? index : -1))
        .filter(
          (index) =>
            index >= selectedSegmentRange.start &&
            index <= selectedSegmentRange.end,
        )
    : [];
  const previousWordIndex = selectedSegmentRange
    ? segments.findLastIndex(
        (segment, index) =>
          segment.isWord && index < selectedSegmentRange.start,
      )
    : -1;
  const nextWordIndex = selectedSegmentRange
    ? segments.findIndex(
        (segment, index) =>
          segment.isWord && index > selectedSegmentRange.end,
      )
    : -1;

  const clearQueuedSelectionWork = useCallback(() => {
    if (selectionFrameRef.current !== null) {
      window.cancelAnimationFrame(selectionFrameRef.current);
      selectionFrameRef.current = null;
    }

    selectionTimeoutRefs.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    selectionTimeoutRefs.current = [];
  }, []);

  const updateSelection = useCallback(() => {
    const selection = window.getSelection();
    const container = sentenceRef.current;

    if (!selection || selection.isCollapsed || !container) {
      return;
    }

    if (
      !selection.anchorNode ||
      !selection.focusNode ||
      !container.contains(selection.anchorNode) ||
      !container.contains(selection.focusNode)
    ) {
      return;
    }

    const nextSelectedText = normalizeSelectedText(selection.toString());

    if (nextSelectedText) {
      setSelectedText(nextSelectedText);

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedIndexes = Array.from(
          container.querySelectorAll<HTMLElement>("[data-segment-index]"),
        )
          .filter(
            (element) =>
              element.dataset.isWord === "true" && range.intersectsNode(element),
          )
          .map((element) => Number(element.dataset.segmentIndex))
          .filter(Number.isInteger);

        if (selectedIndexes.length > 0) {
          setSelectedSegmentRange({
            end: Math.max(...selectedIndexes),
            start: Math.min(...selectedIndexes),
          });
        }
      }
    }
  }, []);

  const queueSelectionUpdate = useCallback(() => {
    if (selectionFrameRef.current !== null) {
      window.cancelAnimationFrame(selectionFrameRef.current);
    }

    selectionFrameRef.current = window.requestAnimationFrame(() => {
      selectionFrameRef.current = null;
      updateSelection();
    });
  }, [updateSelection]);

  const scheduleSelectionUpdate = useCallback(() => {
    selectionTimeoutRefs.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    selectionTimeoutRefs.current = [];
    queueSelectionUpdate();

    selectionTimeoutRefs.current = [80, 180, 360].map((delay) =>
      window.setTimeout(queueSelectionUpdate, delay),
    );
  }, [queueSelectionUpdate]);

  const handleSelectionChange = useCallback(() => {
    if (!isPointerSelectingRef.current) {
      scheduleSelectionUpdate();
    }
  }, [scheduleSelectionUpdate]);

  const startPointerSelection = useCallback(() => {
    isPointerSelectingRef.current = true;
    clearQueuedSelectionWork();
  }, [clearQueuedSelectionWork]);

  const finishPointerSelection = useCallback(() => {
    if (!isPointerSelectingRef.current) {
      return;
    }

    isPointerSelectingRef.current = false;
    scheduleSelectionUpdate();
  }, [scheduleSelectionUpdate]);

  function clearSelection() {
    clearQueuedSelectionWork();
    setSelectedSegmentRange(null);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }

  function addSelectedExpression() {
    onAddExpression(selectedText, currentSentence);
    clearSelection();
  }

  function selectRange(start: number, end: number) {
    const selection = window.getSelection();
    const container = sentenceRef.current;

    if (!selection || !container) {
      return;
    }

    const firstSegment = container.querySelector<HTMLElement>(
      `[data-segment-index="${start}"]`,
    );
    const lastSegment = container.querySelector<HTMLElement>(
      `[data-segment-index="${end}"]`,
    );

    if (!firstSegment || !lastSegment) {
      return;
    }

    const range = document.createRange();
    range.setStartBefore(firstSegment);
    range.setEndAfter(lastSegment);
    selection.removeAllRanges();
    selection.addRange(range);
    setSelectedSegmentRange({ end, start });
    setSelectedText(
      normalizeSelectedText(
        segments
          .slice(start, end + 1)
          .map((segment) => segment.text)
          .join(""),
      ),
    );
  }

  function selectTappedWord(index: number) {
    const selection = window.getSelection();

    if (!selection || !selection.isCollapsed) {
      return;
    }

    selectRange(index, index);
  }

  function expandSelection(side: "left" | "right") {
    if (!selectedSegmentRange) {
      return;
    }

    if (side === "left" && previousWordIndex >= 0) {
      selectRange(previousWordIndex, selectedSegmentRange.end);
    }

    if (side === "right" && nextWordIndex >= 0) {
      selectRange(selectedSegmentRange.start, nextWordIndex);
    }
  }

  function shrinkSelection(side: "left" | "right") {
    if (!selectedSegmentRange || selectedWordIndexes.length <= 1) {
      return;
    }

    if (side === "left") {
      selectRange(selectedWordIndexes[1], selectedSegmentRange.end);
    } else {
      selectRange(
        selectedSegmentRange.start,
        selectedWordIndexes[selectedWordIndexes.length - 2],
      );
    }
  }

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("pointerup", finishPointerSelection);
    document.addEventListener("pointercancel", finishPointerSelection);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("pointerup", finishPointerSelection);
      document.removeEventListener("pointercancel", finishPointerSelection);
      clearQueuedSelectionWork();
    };
  }, [clearQueuedSelectionWork, finishPointerSelection, handleSelectionChange]);

  return (
    <section className="grid gap-3 rounded-xl border border-brand-border bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <Highlighter aria-hidden className="size-4" />
        </span>
        <div>
          <p className="text-base font-black text-brand-text">
            이 문장에서 고르기
          </p>
          <p className="text-xs font-semibold text-brand-muted">
            단어는 탭하고, 긴 표현은 드래그하세요.
          </p>
        </div>
      </div>

      {sentences.length > 1 ? (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <button
            aria-label="이전 문장"
            className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeSentenceIndex === 0}
            onClick={() => {
              setCurrentSentenceIndex(Math.max(activeSentenceIndex - 1, 0));
              clearSelection();
            }}
            type="button"
          >
            이전
          </button>
          <p className="text-center text-sm font-bold text-slate-500">
            {activeSentenceIndex + 1}/{sentences.length}
          </p>
          <button
            aria-label="다음 문장"
            className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeSentenceIndex >= sentences.length - 1}
            onClick={() => {
              setCurrentSentenceIndex(
                Math.min(activeSentenceIndex + 1, sentences.length - 1),
              );
              clearSelection();
            }}
            type="button"
          >
            다음
          </button>
        </div>
      ) : null}

      <div
        aria-label="문장에서 단어 또는 표현 선택"
        className="select-text rounded-lg border border-brand-border bg-white p-3 text-xl font-semibold leading-9 text-brand-text [-webkit-user-select:text]"
        onKeyUp={scheduleSelectionUpdate}
        onPointerCancel={finishPointerSelection}
        onPointerDown={startPointerSelection}
        onPointerUp={finishPointerSelection}
        ref={sentenceRef}
        tabIndex={0}
      >
        <span className="rounded-sm bg-amber-200 px-1 py-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] selection:bg-blue-500 selection:text-white">
          {segmentsQuery.data?.segments.map((segment, index) =>
            segment.isWord ? (
              <span
                className="cursor-pointer rounded-sm hover:bg-amber-300 selection:bg-blue-500 selection:text-white"
                data-is-word="true"
                data-segment-index={index}
                key={`${index}-${segment.text}`}
                onClick={() => selectTappedWord(index)}
              >
                {segment.text}
              </span>
            ) : (
              <span
                data-is-word="false"
                data-segment-index={index}
                key={`${index}-${segment.text}`}
              >
                {segment.text}
              </span>
            ),
          ) ?? (currentSentence || "선택할 문장이 없습니다.")}
        </span>
      </div>

      {selectedText ? (
        <div className="grid gap-2 rounded-lg bg-brand-background p-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="min-w-0 truncate text-sm font-semibold text-brand-text">
              선택: {selectedText}
            </p>
            <button
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={addSelectedExpression}
              type="button"
            >
              추가
            </button>
          </div>

          {selectedSegmentRange ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <button
                className="min-h-9 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-muted disabled:cursor-not-allowed disabled:opacity-40"
                disabled={selectedWordIndexes.length <= 1}
                onClick={() => shrinkSelection("left")}
                type="button"
              >
                왼쪽 빼기
              </button>
              <button
                className="min-h-9 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-text disabled:cursor-not-allowed disabled:opacity-40"
                disabled={previousWordIndex < 0}
                onClick={() => expandSelection("left")}
                type="button"
              >
                ← 왼쪽 추가
              </button>
              <button
                className="min-h-9 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-text disabled:cursor-not-allowed disabled:opacity-40"
                disabled={nextWordIndex < 0}
                onClick={() => expandSelection("right")}
                type="button"
              >
                오른쪽 추가 →
              </button>
              <button
                className="min-h-9 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-muted disabled:cursor-not-allowed disabled:opacity-40"
                disabled={selectedWordIndexes.length <= 1}
                onClick={() => shrinkSelection("right")}
                type="button"
              >
                오른쪽 빼기
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
