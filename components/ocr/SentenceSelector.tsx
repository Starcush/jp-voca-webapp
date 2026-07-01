"use client";

import { useRef, useState } from "react";

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
  const lastSentenceIndex = Math.max(sentences.length - 1, 0);
  const activeSentenceIndex = Math.min(currentSentenceIndex, lastSentenceIndex);
  const currentSentence = sentences[activeSentenceIndex] ?? "";

  function clearSelection() {
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }

  function updateSelection() {
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
  }

  function addSelectedExpression() {
    onAddExpression(selectedText, currentSentence);
    clearSelection();
  }

  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-slate-950">문장별 선택</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            문장에서 단어, 문법, 짧은 구절을 드래그하거나 길게 눌러 선택하세요.
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-slate-500">
          {activeSentenceIndex + 1} / {sentences.length}
        </p>
      </div>

      <div
        className="select-text rounded-lg border border-slate-200 bg-slate-50 p-4 text-lg font-semibold leading-8 text-slate-950"
        onKeyUp={updateSelection}
        onMouseUp={updateSelection}
        onTouchEnd={() => window.setTimeout(updateSelection, 0)}
        ref={sentenceRef}
        tabIndex={0}
      >
        {currentSentence}
      </div>

      {selectedText ? (
        <button
          className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={addSelectedExpression}
          type="button"
        >
          선택한 표현 추가: {selectedText}
        </button>
      ) : (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
          선택한 텍스트가 여기에 표시됩니다.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          className="min-h-11 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={activeSentenceIndex === 0}
          onClick={() => {
            setCurrentSentenceIndex(Math.max(activeSentenceIndex - 1, 0));
            clearSelection();
          }}
          type="button"
        >
          이전 문장
        </button>
        <button
          className="min-h-11 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={activeSentenceIndex >= sentences.length - 1}
          onClick={() => {
            setCurrentSentenceIndex(
              Math.min(activeSentenceIndex + 1, sentences.length - 1),
            );
            clearSelection();
          }}
          type="button"
        >
          다음 문장
        </button>
      </div>
    </section>
  );
}
