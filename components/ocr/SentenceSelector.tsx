"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Highlighter, Minus, Plus } from "lucide-react";
import { useTextSegmentsQuery } from "@/components/ocr/useTextSegmentsQuery";
import type { Language } from "@/types/language";

type SentenceSelectorProps = {
  language: Language;
  onAddExpression: (term: string, sourceSentence: string) => void;
  onUpdateSentence?: (index: number, sentence: string) => void;
  sentences: string[];
};

type TextRange = {
  end: number;
  start: number;
};

type SegmentOffset = TextRange;

type DomPoint = {
  node: Node;
  offset: number;
};

function normalizeSelectedText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getGraphemeBoundaries(text: string) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const boundaries = Array.from(segmenter.segment(text), ({ index }) => index);

  return Array.from(new Set([0, ...boundaries, text.length])).sort(
    (left, right) => left - right,
  );
}

function getTextOffset(container: HTMLElement, node: Node, offset: number) {
  const prefixRange = document.createRange();
  prefixRange.selectNodeContents(container);
  prefixRange.setEnd(node, offset);

  return prefixRange.toString().length;
}

/**
 * OCR 텍스트를 문장 단위로 넘기며 사용자가 단어/표현을 선택하는 컴포넌트입니다.
 *
 * @param props - 문장 선택 UI에 필요한 속성입니다.
 * @param props.language - 탭할 단어의 경계를 판별할 문장 언어입니다.
 * @param props.sentences - OCR 원문에서 분리된 문장 목록입니다.
 * @param props.onAddExpression - 사용자가 선택한 표현과 원문 문장을 부모로 전달하는 콜백입니다.
 * @param props.onUpdateSentence - 현재 문장을 수정해 부모 상태에 반영하는 선택적 콜백입니다.
 * @returns 현재 문장, 선택한 텍스트, 표현 추가 버튼, 이전/다음 문장 이동 UI를 렌더링합니다.
 */
export function SentenceSelector({
  language,
  onAddExpression,
  onUpdateSentence,
  sentences,
}: SentenceSelectorProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [localSentences, setLocalSentences] = useState(() => sentences);
  const [selectedRange, setSelectedRange] = useState<TextRange | null>(null);
  const sentenceRef = useRef<HTMLDivElement>(null);
  const isPointerSelectingRef = useRef(false);
  const selectionFrameRef = useRef<number | null>(null);
  const selectionTimeoutRefs = useRef<number[]>([]);
  const editableSentences = onUpdateSentence ? sentences : localSentences;
  const lastSentenceIndex = Math.max(editableSentences.length - 1, 0);
  const activeSentenceIndex = Math.min(currentSentenceIndex, lastSentenceIndex);
  const currentSentence = editableSentences[activeSentenceIndex] ?? "";
  const segmentsQuery = useTextSegmentsQuery(language, currentSentence);
  const segments = useMemo(
    () => segmentsQuery.data?.segments ?? [],
    [segmentsQuery.data?.segments],
  );
  const segmentOffsets = useMemo(() => {
    return segments.reduce<SegmentOffset[]>((offsets, segment) => {
      const start = offsets.at(-1)?.end ?? 0;

      return [...offsets, { end: start + segment.text.length, start }];
    }, []);
  }, [segments]);
  const graphemeBoundaries = useMemo(
    () => getGraphemeBoundaries(currentSentence),
    [currentSentence],
  );
  const selectedText = useMemo(
    () =>
      selectedRange
        ? normalizeSelectedText(
            currentSentence.slice(selectedRange.start, selectedRange.end),
          )
        : "",
    [currentSentence, selectedRange],
  );
  const nextStartBoundary = selectedRange
    ? graphemeBoundaries.find((boundary) => boundary > selectedRange.start)
    : undefined;
  const previousStartBoundary = selectedRange
    ? graphemeBoundaries.findLast(
        (boundary) => boundary < selectedRange.start,
      )
    : undefined;
  const nextEndBoundary = selectedRange
    ? graphemeBoundaries.find((boundary) => boundary > selectedRange.end)
    : undefined;
  const previousEndBoundary = selectedRange
    ? graphemeBoundaries.findLast((boundary) => boundary < selectedRange.end)
    : undefined;

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

    if (selection.rangeCount > 0 && normalizeSelectedText(selection.toString())) {
      const range = selection.getRangeAt(0);
      const start = getTextOffset(container, range.startContainer, range.startOffset);
      const end = getTextOffset(container, range.endContainer, range.endOffset);

      if (start < end) {
        setSelectedRange({ end, start });
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
    setSelectedRange(null);

    const selection = window.getSelection();
    const container = sentenceRef.current;
    const isSentenceSelection =
      selection &&
      container &&
      ((selection.anchorNode && container.contains(selection.anchorNode)) ||
        (selection.focusNode && container.contains(selection.focusNode)));

    if (isSentenceSelection) {
      selection.removeAllRanges();
    }
  }

  function addSelectedExpression() {
    onAddExpression(selectedText, currentSentence);
    clearSelection();
  }

  function updateCurrentSentence(sentence: string) {
    clearSelection();

    if (onUpdateSentence) {
      onUpdateSentence(activeSentenceIndex, sentence);
      return;
    }

    setLocalSentences((currentSentences) =>
      currentSentences.map((currentValue, index) =>
        index === activeSentenceIndex ? sentence : currentValue,
      ),
    );
  }

  function getDomPoint(offset: number, edge: "start" | "end"): DomPoint | null {
    const container = sentenceRef.current;

    if (!container || segmentOffsets.length === 0) {
      return null;
    }

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-segment-index]"),
    );
    const preferredIndex = segmentOffsets.findIndex((segmentOffset, index) => {
      if (edge === "start" && offset === segmentOffset.end) {
        return index === segmentOffsets.length - 1;
      }

      return offset >= segmentOffset.start && offset <= segmentOffset.end;
    });
    const nextIndex =
      edge === "start" &&
      preferredIndex >= 0 &&
      offset === segmentOffsets[preferredIndex].end &&
      preferredIndex < segmentOffsets.length - 1
        ? preferredIndex + 1
        : preferredIndex;
    const element = elements[nextIndex];
    const textNode = element?.firstChild;

    if (!textNode || nextIndex < 0) {
      return null;
    }

    return {
      node: textNode,
      offset: Math.max(0, offset - segmentOffsets[nextIndex].start),
    };
  }

  function selectRange(start: number, end: number) {
    const selection = window.getSelection();

    if (!selection || start >= end) {
      return;
    }

    const startPoint = getDomPoint(start, "start");
    const endPoint = getDomPoint(end, "end");

    if (!startPoint || !endPoint) {
      return;
    }

    const range = document.createRange();
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
    selection.removeAllRanges();
    selection.addRange(range);
    setSelectedRange({ end, start });
  }

  function selectTappedWord(index: number) {
    const selection = window.getSelection();

    if (!selection || !selection.isCollapsed) {
      return;
    }

    const segmentOffset = segmentOffsets[index];

    if (segmentOffset) {
      selectRange(segmentOffset.start, segmentOffset.end);
    }
  }

  function expandSelection(side: "left" | "right") {
    if (!selectedRange) {
      return;
    }

    if (side === "left" && previousStartBoundary !== undefined) {
      selectRange(previousStartBoundary, selectedRange.end);
    }

    if (side === "right" && nextEndBoundary !== undefined) {
      selectRange(selectedRange.start, nextEndBoundary);
    }
  }

  function shrinkSelection(side: "left" | "right") {
    if (!selectedRange) {
      return;
    }

    if (
      side === "left" &&
      nextStartBoundary !== undefined &&
      nextStartBoundary < selectedRange.end
    ) {
      selectRange(nextStartBoundary, selectedRange.end);
    }

    if (
      side === "right" &&
      previousEndBoundary !== undefined &&
      previousEndBoundary > selectedRange.start
    ) {
      selectRange(selectedRange.start, previousEndBoundary);
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
            모르는 표현 고르기
          </p>
          <p className="text-xs font-semibold text-brand-muted">
            단어를 탭하고, 필요하면 앞뒤를 한 글자씩 조절하세요.
          </p>
        </div>
      </div>

      {editableSentences.length > 1 ? (
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
            {activeSentenceIndex + 1}/{editableSentences.length}
          </p>
          <button
            aria-label="다음 문장"
            className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeSentenceIndex >= editableSentences.length - 1}
            onClick={() => {
              setCurrentSentenceIndex(
                Math.min(
                  activeSentenceIndex + 1,
                  editableSentences.length - 1,
                ),
              );
              clearSelection();
            }}
            type="button"
          >
            다음
          </button>
        </div>
      ) : null}

      <label className="grid gap-1.5">
        <span className="text-xs font-bold text-brand-muted">문장 수정</span>
        <textarea
          className="min-h-20 resize-y rounded-lg border-brand-border bg-white text-base leading-7 text-brand-text"
          onChange={(event) => updateCurrentSentence(event.target.value)}
          value={currentSentence}
        />
      </label>

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

          {selectedRange ? (
            <div className="grid gap-2 border-t border-brand-border/70 pt-2">
              <p className="text-xs font-bold text-brand-muted">
                선택 영역 조절
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-brand-muted">
                    앞쪽
                  </span>
                  <div className="inline-flex gap-1.5">
                    <button
                      aria-label="앞쪽 한 글자 빼기"
                      className="grid size-12 place-items-center rounded-lg border border-brand-border bg-white text-brand-text shadow-sm transition-colors hover:border-primary-border hover:text-primary disabled:cursor-not-allowed disabled:text-brand-muted-soft disabled:shadow-none"
                      disabled={
                        nextStartBoundary === undefined ||
                        nextStartBoundary >= selectedRange.end
                      }
                      onClick={() => shrinkSelection("left")}
                      title="앞쪽 한 글자 빼기"
                      type="button"
                    >
                      <Minus aria-hidden className="size-5" />
                    </button>
                    <button
                      aria-label="앞쪽 한 글자 추가"
                      className="grid size-12 place-items-center rounded-lg border border-brand-border bg-white text-brand-text shadow-sm transition-colors hover:border-primary-border hover:text-primary disabled:cursor-not-allowed disabled:text-brand-muted-soft disabled:shadow-none"
                      disabled={previousStartBoundary === undefined}
                      onClick={() => expandSelection("left")}
                      title="앞쪽 한 글자 추가"
                      type="button"
                    >
                      <Plus aria-hidden className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-brand-muted">
                    뒤쪽
                  </span>
                  <div className="inline-flex gap-1.5">
                    <button
                      aria-label="뒤쪽 한 글자 빼기"
                      className="grid size-12 place-items-center rounded-lg border border-brand-border bg-white text-brand-text shadow-sm transition-colors hover:border-primary-border hover:text-primary disabled:cursor-not-allowed disabled:text-brand-muted-soft disabled:shadow-none"
                      disabled={
                        previousEndBoundary === undefined ||
                        previousEndBoundary <= selectedRange.start
                      }
                      onClick={() => shrinkSelection("right")}
                      title="뒤쪽 한 글자 빼기"
                      type="button"
                    >
                      <Minus aria-hidden className="size-5" />
                    </button>
                    <button
                      aria-label="뒤쪽 한 글자 추가"
                      className="grid size-12 place-items-center rounded-lg border border-brand-border bg-white text-brand-text shadow-sm transition-colors hover:border-primary-border hover:text-primary disabled:cursor-not-allowed disabled:text-brand-muted-soft disabled:shadow-none"
                      disabled={nextEndBoundary === undefined}
                      onClick={() => expandSelection("right")}
                      title="뒤쪽 한 글자 추가"
                      type="button"
                    >
                      <Plus aria-hidden className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
