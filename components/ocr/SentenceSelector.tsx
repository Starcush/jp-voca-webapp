"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SentenceSelectorProps = {
  onAddExpression: (term: string, sourceSentence: string) => void;
  sentences: string[];
};

function normalizeSelectedText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * OCR 텍스트를 문장 단위로 넘기며 사용자가 단어/표현을 선택하는 컴포넌트입니다.
 *
 * @param props - 문장 선택 UI에 필요한 속성입니다.
 * @param props.sentences - OCR 원문에서 분리된 문장 목록입니다.
 * @param props.onAddExpression - 사용자가 선택한 표현과 원문 문장을 부모로 전달하는 콜백입니다.
 * @returns 현재 문장, 선택한 텍스트, 표현 추가 버튼, 이전/다음 문장 이동 UI를 렌더링합니다.
 */
export function SentenceSelector({
  onAddExpression,
  sentences,
}: SentenceSelectorProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const sentenceRef = useRef<HTMLDivElement>(null);
  const selectionFrameRef = useRef<number | null>(null);
  const selectionTimeoutRefs = useRef<number[]>([]);
  const lastSentenceIndex = Math.max(sentences.length - 1, 0);
  const activeSentenceIndex = Math.min(currentSentenceIndex, lastSentenceIndex);
  const currentSentence = sentences[activeSentenceIndex] ?? "";

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
      setSelectedText("");
      return;
    }

    if (
      !selection.anchorNode ||
      !selection.focusNode ||
      !container.contains(selection.anchorNode) ||
      !container.contains(selection.focusNode)
    ) {
      setSelectedText("");
      return;
    }

    setSelectedText(normalizeSelectedText(selection.toString()));
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

  function clearSelection() {
    clearQueuedSelectionWork();
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }

  function addSelectedExpression() {
    onAddExpression(selectedText, currentSentence);
    clearSelection();
  }

  function selectSentence(index: number) {
    setCurrentSentenceIndex(index);
    clearSelection();
  }

  useEffect(() => {
    document.addEventListener("selectionchange", scheduleSelectionUpdate);

    return () => {
      document.removeEventListener("selectionchange", scheduleSelectionUpdate);
      clearQueuedSelectionWork();
    };
  }, [clearQueuedSelectionWork, scheduleSelectionUpdate]);

  return (
    <section className="grid gap-3 rounded-xl border border-brand-border bg-white p-3 shadow-sm">
      <div className="grid gap-1">
        <p className="text-base font-black text-brand-text">
          사진에서 찾은 문장
        </p>
        <p className="text-sm leading-5 text-brand-muted">
          문장을 고른 뒤, 크게 보이는 문장에서 저장할 표현을 선택하세요.
        </p>
      </div>

      <ol className="grid max-h-56 gap-2 overflow-y-auto pr-1">
        {sentences.map((sentence, index) => {
          const isActive = index === activeSentenceIndex;

          return (
            <li key={`selectable-sentence-${index}`}>
              <button
                aria-current={isActive ? "true" : undefined}
                className={`grid w-full gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/8 text-brand-text"
                    : "border-brand-border bg-white text-brand-muted"
                }`}
                onClick={() => selectSentence(index)}
                type="button"
              >
                <span className="text-xs font-black">문장 {index + 1}</span>
                <span className="line-clamp-2 text-sm font-semibold leading-5">
                  {sentence || "빈 문장"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-3 rounded-xl border border-brand-border bg-brand-background/70 p-3">
        <div className="min-w-0">
          <p className="text-base font-black text-brand-text">
            이 문장에서 고르기
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            단어, 문법, 짧은 구절을 선택하면 바로 추가할 수 있어요.
          </p>
        </div>
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

        <div
          className="select-text rounded-lg border border-brand-border bg-white p-3 text-xl font-semibold leading-9 text-brand-text [-webkit-user-select:text]"
          onKeyUp={scheduleSelectionUpdate}
          onMouseUp={scheduleSelectionUpdate}
          onPointerUp={scheduleSelectionUpdate}
          onSelect={scheduleSelectionUpdate}
          onTouchEnd={scheduleSelectionUpdate}
          ref={sentenceRef}
          tabIndex={0}
        >
          {currentSentence || "선택할 문장이 없습니다."}
        </div>

        {selectedText ? (
          <div className="grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-[1fr_auto] sm:items-center">
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
        ) : (
          <p className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-muted">
            선택한 텍스트가 여기에 표시됩니다.
          </p>
        )}
      </div>
    </section>
  );
}
