"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { REVIEW_LIMIT, reviewModes } from "@/components/review/review-options";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewCompleteState } from "@/components/review/ReviewCompleteState";
import { ReviewEmptyState } from "@/components/review/ReviewEmptyState";
import { ReviewErrorState } from "@/components/review/ReviewErrorState";
import { ReviewLoadingState } from "@/components/review/ReviewLoadingState";
import { ReviewModeTabs } from "@/components/review/ReviewModeTabs";
import { useReviewSessionState } from "@/components/review/useReviewSessionState";
import { useReviewWordsQuery } from "@/components/review/useReviewWordsQuery";
import type { ReviewMode } from "@/components/review/types";
import { getLanguageOption } from "@/lib/languages";
import { updateWordStudyStatus } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { WordStatus } from "@/types/word";

type ReviewSessionProps = {
  language: Language;
};

function getEmptyReviewMessage(mode: ReviewMode) {
  if (mode === "unknown") {
    return "모르는 단어가 없습니다";
  }

  return "복습할 단어가 없습니다";
}

/**
 * 선택한 언어의 단어를 20개 단위로 복습하는 화면을 렌더링합니다.
 *
 * @param props - 복습 화면에 필요한 속성입니다.
 * @param props.language - 복습할 단어장의 현재 언어입니다.
 * @returns 복습 모드 선택, 카드 복습, 완료/빈 상태/에러 상태 UI를 렌더링합니다.
 */
export function ReviewSession({ language }: ReviewSessionProps) {
  const router = useRouter();
  const session = useSession() ?? null;
  const languageOption = getLanguageOption(language);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("priority");
  const [reviewOffset, setReviewOffset] = useState(0);
  const [randomSeed, setRandomSeed] = useState(0);
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
    offset: reviewOffset,
    randomSeed,
    reviewMode,
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
      await updateWordStudyStatus(currentWord.id, status);
      recordAnswer(status);
    } catch (error) {
      console.error("Failed to update review status.", error);
      toast.error("복습 상태를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReviewModeChange(nextReviewMode: ReviewMode) {
    setReviewMode(nextReviewMode);
    setReviewOffset(0);
    resetReviewProgress();

    if (nextReviewMode === "random") {
      setRandomSeed((seed) => seed + 1);
    }
  }

  function handleRestartReview() {
    resetReviewProgress();

    if (isRandomMode) {
      setReviewOffset(0);
      setRandomSeed((seed) => seed + 1);
      void refetchReviewWords();
      return;
    }

    if (hasNextReviewSet) {
      setReviewOffset((offset) => offset + REVIEW_LIMIT);
      return;
    }

    setReviewOffset(0);
    void refetchReviewWords();
  }

  const currentWord = reviewWords[currentIndex];
  const isComplete = reviewWords.length > 0 && currentIndex >= reviewWords.length;
  const activeReviewMode = reviewModes.find((mode) => mode.value === reviewMode) ?? reviewModes[0];
  const isRandomMode = reviewMode === "random";
  const remainingReviewCount = Math.max(
    reviewTotalCount - reviewOffset - reviewWords.length,
    0,
  );
  const hasNextReviewSet = !isRandomMode && remainingReviewCount > 0;
  const reviewModeTabs = (
    <ReviewModeTabs
      activeReviewMode={activeReviewMode}
      isDisabled={isLoading || isSaving}
      onModeChange={handleReviewModeChange}
      reviewMode={reviewMode}
    />
  );

  if (isLoading) {
    return (
      <ReviewLoadingState
        languageLabel={languageOption.label}
        modeTabs={reviewModeTabs}
      />
    );
  }

  if (errorMessage) {
    return (
      <ReviewErrorState
        errorMessage={errorMessage}
        modeTabs={reviewModeTabs}
        onRetry={() => {
            resetReviewProgress();
            void refetchReviewWords();
        }}
      />
    );
  }

  if (reviewWords.length === 0) {
    return (
      <ReviewEmptyState
        emptyMessage={getEmptyReviewMessage(reviewMode)}
        language={language}
        languageLabel={languageOption.label}
        modeTabs={reviewModeTabs}
      />
    );
  }

  if (isComplete) {
    return (
      <ReviewCompleteState
        hasNextReviewSet={hasNextReviewSet}
        isRandomMode={isRandomMode}
        knownCount={knownCount}
        language={language}
        languageLabel={languageOption.label}
        onRestart={handleRestartReview}
        remainingReviewCount={remainingReviewCount}
        reviewWordCount={reviewWords.length}
        unknownCount={unknownCount}
      />
    );
  }

  if (!currentWord) {
    return null;
  }

  return (
    <ReviewCard
      activeReviewModeLabel={activeReviewMode.label}
      currentIndex={currentIndex}
      isAnswerVisible={isAnswerVisible}
      isSaving={isSaving}
      languageLabel={languageOption.label}
      modeTabs={reviewModeTabs}
      onRevealAnswer={revealAnswer}
      onStudyStatus={(status) => void handleStudyStatus(status)}
      readingLabel={languageOption.readingLabel}
      reviewWordCount={reviewWords.length}
      word={currentWord}
    />
  );
}
