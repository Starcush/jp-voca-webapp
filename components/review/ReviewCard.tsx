"use client";

import { Eye } from "lucide-react";
import { getWordReading, getWordTerm } from "@/lib/words";
import type { Word, WordStatus } from "@/types/word";

type ReviewCardProps = {
  currentIndex: number;
  isAnswerVisible: boolean;
  isSaving: boolean;
  languageLabel: string;
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
 * @param props.readingLabel - 언어별 읽기 라벨입니다.
 * @param props.onRevealAnswer - 정답 보기 액션입니다.
 * @param props.onStudyStatus - 알았어요/모르겠어요 액션입니다.
 * @returns 현재 복습 카드와 정답 공개/학습 상태 버튼을 렌더링합니다.
 */
export function ReviewCard({
  currentIndex,
  isAnswerVisible,
  isSaving,
  languageLabel,
  onRevealAnswer,
  onStudyStatus,
  readingLabel,
  reviewWordCount,
  word,
}: ReviewCardProps) {
  const term = getWordTerm(word);
  const reading = getWordReading(word);
  const progressPercent = Math.round(
    ((currentIndex + 1) / reviewWordCount) * 100,
  );

  return (
    <section className="flex flex-1 flex-col gap-3">
      <div className="grid gap-2">
        <div className="flex items-center justify-between text-sm font-bold text-brand-muted">
          <span>{languageLabel} 복습</span>
          <span className="text-brand-text">
            {currentIndex + 1} / {reviewWordCount}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <article className="flex min-h-[18rem] flex-col justify-center rounded-xl border border-brand-border bg-white p-4 shadow-[0_2px_10px_rgba(36,28,61,0.06)] sm:min-h-[22rem]">
        <button
          className="grid gap-3 rounded-lg px-2 py-6 text-center transition-colors hover:bg-brand-background/60"
          onClick={onRevealAnswer}
          type="button"
        >
          <p className="font-japanese text-3xl font-semibold leading-tight tracking-normal text-word-kanji sm:text-4xl">
            {term}
          </p>
          {!isAnswerVisible ? (
            <p className="inline-flex items-center justify-center gap-1 text-sm font-bold text-brand-muted">
              <Eye aria-hidden className="size-4" strokeWidth={2.2} />
              눌러서 정답 보기
            </p>
          ) : null}
        </button>

        {isAnswerVisible ? (
          <div className="mt-4 grid gap-3 border-t border-brand-border pt-4">
            {reading ? (
              <div>
                <p className="text-xs font-bold text-brand-muted">
                  {readingLabel ?? "읽기"}
                </p>
                <p className="font-japanese mt-1 text-base font-semibold text-primary-text">
                  {reading}
                </p>
              </div>
            ) : null}
            {word.meaning ? (
              <div>
                <p className="text-xs font-bold text-brand-muted">뜻</p>
                <p className="mt-1 text-lg font-semibold text-word-meaning">
                  {word.meaning}
                </p>
              </div>
            ) : null}
            {word.exampleSentence || word.exampleTranslation ? (
              <div className="grid gap-1">
                <p className="text-xs font-bold text-brand-muted">예문</p>
                {word.exampleSentence ? (
                  <p className="font-japanese text-sm font-medium leading-6 text-word-example">
                    {word.exampleSentence}
                  </p>
                ) : null}
                {word.exampleTranslation ? (
                  <p className="text-sm leading-6 text-brand-muted">
                    {word.exampleTranslation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      {isAnswerVisible ? (
        <div className="grid grid-cols-2 gap-2 pb-2 md:pb-0">
          <button
            className="min-h-11 rounded-lg border border-brand-border bg-white px-4 text-base font-black text-brand-text shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() => onStudyStatus("unknown")}
            type="button"
          >
            모르겠어요
          </button>
          <button
            className="min-h-11 rounded-lg bg-primary px-4 text-base font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
            disabled={isSaving}
            onClick={() => onStudyStatus("known")}
            type="button"
          >
            알았어요
          </button>
        </div>
      ) : null}
    </section>
  );
}
