"use client";

import type { ReactNode } from "react";
import { getWordReading, getWordTerm } from "@/lib/words";
import type { Word, WordStatus } from "@/types/word";

type ReviewCardProps = {
  activeReviewModeLabel: string;
  currentIndex: number;
  isAnswerVisible: boolean;
  isSaving: boolean;
  languageLabel: string;
  modeTabs: ReactNode;
  onRevealAnswer: () => void;
  onStudyStatus: (status: WordStatus) => void;
  readingLabel?: string;
  reviewWordCount: number;
  word: Word;
};

/**
 * 복습 중인 현재 단어 카드와 정답/상태 버튼을 렌더링합니다.
 *
 * @param props - 현재 복습 카드에 필요한 단어와 진행 상태입니다.
 * @param props.word - 현재 복습할 단어입니다.
 * @param props.currentIndex - 현재 카드의 0-based index입니다.
 * @param props.reviewWordCount - 현재 세트의 전체 단어 수입니다.
 * @param props.isAnswerVisible - 정답 영역을 보여줄지 여부입니다.
 * @param props.isSaving - 학습 상태 저장 중인지 여부입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @param props.activeReviewModeLabel - 현재 복습 모드의 표시 이름입니다.
 * @param props.readingLabel - 언어별 읽기 라벨입니다.
 * @param props.modeTabs - 복습 모드 선택 탭입니다.
 * @param props.onRevealAnswer - 정답 보기 액션입니다.
 * @param props.onStudyStatus - 알았어요/모르겠어요 액션입니다.
 * @returns 현재 복습 카드와 정답 공개/학습 상태 버튼을 렌더링합니다.
 */
export function ReviewCard({
  activeReviewModeLabel,
  currentIndex,
  isAnswerVisible,
  isSaving,
  languageLabel,
  modeTabs,
  onRevealAnswer,
  onStudyStatus,
  readingLabel,
  reviewWordCount,
  word,
}: ReviewCardProps) {
  const term = getWordTerm(word);
  const reading = getWordReading(word);

  return (
    <section className="flex flex-1 flex-col gap-4">
      {modeTabs}
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
        <span>
          {languageLabel} · {activeReviewModeLabel}
        </span>
        <span>
          {currentIndex + 1} / {reviewWordCount}
        </span>
      </div>

      <article className="flex flex-1 flex-col justify-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <button
          className="grid gap-4 text-center"
          onClick={onRevealAnswer}
          type="button"
        >
          <p className="text-4xl font-bold leading-tight tracking-normal text-word-kanji">
            {term}
          </p>
          {!isAnswerVisible ? (
            <p className="text-sm font-semibold text-slate-400">
              눌러서 정답 보기
            </p>
          ) : null}
        </button>

        {isAnswerVisible ? (
          <div className="mt-8 grid gap-4 border-t border-slate-100 pt-5">
            {reading ? (
              <div>
                <p className="text-xs font-bold text-slate-400">
                  {readingLabel ?? "읽기"}
                </p>
                <p className="mt-1 text-base font-bold text-blue-600">{reading}</p>
              </div>
            ) : null}
            {word.meaning ? (
              <div>
                <p className="text-xs font-bold text-slate-400">뜻</p>
                <p className="mt-1 text-lg font-bold text-word-meaning">
                  {word.meaning}
                </p>
              </div>
            ) : null}
            {word.exampleSentence || word.exampleTranslation ? (
              <div className="grid gap-1">
                <p className="text-xs font-bold text-slate-400">예문</p>
                {word.exampleSentence ? (
                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    {word.exampleSentence}
                  </p>
                ) : null}
                {word.exampleTranslation ? (
                  <p className="text-sm leading-6 text-slate-500">
                    {word.exampleTranslation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      {isAnswerVisible ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="min-h-12 rounded-lg bg-red-600 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() => onStudyStatus("unknown")}
            type="button"
          >
            모르겠어요
          </button>
          <button
            className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() => onStudyStatus("known")}
            type="button"
          >
            알았어요
          </button>
        </div>
      ) : (
        <button
          className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white"
          onClick={onRevealAnswer}
          type="button"
        >
          정답 보기
        </button>
      )}
    </section>
  );
}
