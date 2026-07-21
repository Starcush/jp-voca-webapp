"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  REVIEW_LIMIT,
  type ReviewDirection,
} from "@/components/review/review-options";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewCompleteState } from "@/components/review/ReviewCompleteState";
import { ReviewEmptyState } from "@/components/review/ReviewEmptyState";
import { ReviewErrorState } from "@/components/review/ReviewErrorState";
import { ReviewLoadingState } from "@/components/review/ReviewLoadingState";
import { ReviewNotebookSelector } from "@/components/review/ReviewNotebookSelector";
import { useReviewSessionState } from "@/components/review/useReviewSessionState";
import { useReviewWordsQuery } from "@/components/review/useReviewWordsQuery";
import { getLanguageOption } from "@/lib/languages";
import { updateWordStudyStatus } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { WordStatus } from "@/types/word";

type ReviewSessionProps = {
  language: Language;
  notebookId?: string;
};

/**
 * 선택한 언어의 단어를 20개 단위로 복습하는 화면을 렌더링합니다.
 *
 * @param props - 복습 화면에 필요한 속성입니다.
 * @param props.language - 복습할 단어장의 현재 언어입니다.
 * @param props.notebookId - 복습할 노트 ID입니다. 없으면 언어 전체를 복습합니다.
 * @returns 카드 복습, 완료/빈 상태/에러 상태 UI를 렌더링합니다.
 */
export function ReviewSession({ language, notebookId }: ReviewSessionProps) {
  const router = useRouter();
  const session = useSession() ?? null;
  const languageOption = getLanguageOption(language);
  const [reviewOffset, setReviewOffset] = useState(0);
  const [reviewDirection, setReviewDirection] =
    useState<ReviewDirection>("termToMeaning");
  const [isSaving, setIsSaving] = useState(false);
  const {
    currentIndex,
    isAnswerVisible,
    knownCount,
    recordAnswer,
    resetReviewProgress,
    revealAnswer,
    unknownCount,
  } = useReviewSessionState();
  const {
    errorMessage,
    isLoading,
    refetchReviewWords,
    reviewTotalCount,
    reviewWords,
  } = useReviewWordsQuery({
    language,
    notebookId,
    offset: reviewOffset,
    reviewDirection,
    session,
  });

  useEffect(() => {
    if (session && !session.defaultLanguage) {
      router.replace("/onboarding/language");
    }
  }, [router, session]);

  async function handleStudyStatus(status: WordStatus) {
    const currentWord = reviewWords[currentIndex];

    if (!currentWord || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await updateWordStudyStatus(currentWord, status);
      recordAnswer(status);
    } catch (error) {
      console.error("Failed to update review status.", error);
      toast.error("복습 상태를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRestartReview() {
    resetReviewProgress();

    if (hasNextReviewSet) {
      setReviewOffset((offset) => offset + REVIEW_LIMIT);
      return;
    }

    setReviewOffset(0);
    void refetchReviewWords();
  }

  function handleReviewDirectionChange(nextReviewDirection: ReviewDirection) {
    if (nextReviewDirection === reviewDirection) {
      return;
    }

    setReviewDirection(nextReviewDirection);
    setReviewOffset(0);
    resetReviewProgress();
  }

  const currentWord = reviewWords[currentIndex];
  const isComplete =
    reviewWords.length > 0 && currentIndex >= reviewWords.length;
  const remainingReviewCount = Math.max(
    reviewTotalCount - reviewOffset - reviewWords.length,
    0,
  );
  const hasNextReviewSet = remainingReviewCount > 0;
  const reviewNotebookSelector = (
    <ReviewNotebookSelector
      language={language}
      reviewTotalCount={reviewTotalCount}
      selectedNotebookId={notebookId}
      session={session}
    />
  );
  const reviewLayoutClass =
    "flex h-[calc(100dvh-5rem)] min-h-0 flex-col gap-2 pt-3 md:h-auto md:flex-1";

  if (isLoading) {
    return (
      <div className={reviewLayoutClass}>
        {reviewNotebookSelector}
        <ReviewLoadingState languageLabel={languageOption.label} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={reviewLayoutClass}>
        {reviewNotebookSelector}
        <ReviewErrorState
          errorMessage={errorMessage}
          onRetry={() => {
            resetReviewProgress();
            void refetchReviewWords();
          }}
        />
      </div>
    );
  }

  if (reviewWords.length === 0) {
    return (
      <div className={reviewLayoutClass}>
        {reviewNotebookSelector}
        <ReviewEmptyState
          emptyMessage={
            reviewDirection === "meaningToTerm"
              ? "뜻이 입력된 복습 단어가 없습니다"
              : "복습할 단어가 없습니다"
          }
          language={language}
          languageLabel={languageOption.label}
          notebookId={notebookId}
        />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className={reviewLayoutClass}>
        {reviewNotebookSelector}
        <ReviewCompleteState
          hasNextReviewSet={hasNextReviewSet}
          knownCount={knownCount}
          language={language}
          languageLabel={languageOption.label}
          notebookId={notebookId}
          onRestart={handleRestartReview}
          remainingReviewCount={remainingReviewCount}
          reviewWordCount={reviewWords.length}
          unknownCount={unknownCount}
        />
      </div>
    );
  }

  if (!currentWord) {
    return null;
  }

  return (
    <div className={reviewLayoutClass}>
      {reviewNotebookSelector}
      <ReviewCard
        currentIndex={currentIndex}
        isAnswerVisible={isAnswerVisible}
        isSaving={isSaving}
        languageLabel={languageOption.label}
        onRevealAnswer={revealAnswer}
        onReviewDirectionChange={handleReviewDirectionChange}
        onStudyStatus={(status) => void handleStudyStatus(status)}
        readingLabel={languageOption.readingLabel}
        reviewDirection={reviewDirection}
        reviewWordCount={reviewWords.length}
        word={currentWord}
      />
    </div>
  );
}
