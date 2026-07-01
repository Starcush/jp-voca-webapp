"use client";

import { useCallback, useReducer } from "react";
import type { WordStatus } from "@/types/word";

type ReviewProgressState = {
  currentIndex: number;
  isAnswerVisible: boolean;
  knownCount: number;
  unknownCount: number;
};

type ReviewProgressAction =
  | { type: "reset" }
  | { type: "revealAnswer" }
  | { status: WordStatus; type: "recordAnswer" };

const initialReviewProgressState: ReviewProgressState = {
  currentIndex: 0,
  isAnswerVisible: false,
  knownCount: 0,
  unknownCount: 0,
};

function reviewProgressReducer(
  state: ReviewProgressState,
  action: ReviewProgressAction,
): ReviewProgressState {
  if (action.type === "reset") {
    return initialReviewProgressState;
  }

  if (action.type === "revealAnswer") {
    return {
      ...state,
      isAnswerVisible: true,
    };
  }

  return {
    currentIndex: state.currentIndex + 1,
    isAnswerVisible: false,
    knownCount:
      action.status === "known" ? state.knownCount + 1 : state.knownCount,
    unknownCount:
      action.status === "unknown" ? state.unknownCount + 1 : state.unknownCount,
  };
}

/**
 * 복습 카드 진행 상태를 reducer로 관리합니다.
 *
 * @returns 현재 카드 index, 정답 공개 여부, 알고/모름 카운트, 진행 상태 액션을 반환합니다.
 */
export function useReviewSessionState() {
  const [state, dispatch] = useReducer(
    reviewProgressReducer,
    initialReviewProgressState,
  );
  const resetReviewProgress = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);
  const revealAnswer = useCallback(() => {
    dispatch({ type: "revealAnswer" });
  }, []);
  const recordAnswer = useCallback((status: WordStatus) => {
    dispatch({ status, type: "recordAnswer" });
  }, []);

  return {
    ...state,
    recordAnswer,
    resetReviewProgress,
    revealAnswer,
  };
}
