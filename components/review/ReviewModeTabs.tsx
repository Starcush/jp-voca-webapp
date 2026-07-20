"use client";

import { reviewModes } from "@/components/review/review-options";
import type { ReviewMode } from "@/components/review/types";

type ReviewModeTabsProps = {
  activeReviewMode: {
    description: string;
    label: string;
    value: ReviewMode;
  };
  isDisabled: boolean;
  onModeChange: (mode: ReviewMode) => void;
  reviewMode: ReviewMode;
};

/**
 * 복습 모드를 선택하는 탭 UI를 렌더링합니다.
 *
 * @param props - 복습 모드 탭에 필요한 상태와 콜백입니다.
 * @param props.reviewMode - 현재 선택된 복습 모드입니다.
 * @param props.activeReviewMode - 현재 선택된 복습 모드의 표시 정보입니다.
 * @param props.isDisabled - 로딩/저장 중 탭을 비활성화할지 여부입니다.
 * @param props.onModeChange - 복습 모드를 변경할 때 호출되는 콜백입니다.
 * @returns 복습 모드 버튼들과 현재 모드 설명을 렌더링합니다.
 */
export function ReviewModeTabs({
  activeReviewMode,
  isDisabled,
  onModeChange,
  reviewMode,
}: ReviewModeTabsProps) {
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-brand-background p-1 md:grid-cols-4">
        {reviewModes.map((mode) => (
          <button
            aria-pressed={reviewMode === mode.value}
            className={`min-h-9 rounded-xl px-2 text-xs font-black transition-colors ${
              reviewMode === mode.value
                ? "bg-primary text-white shadow-sm"
                : "text-brand-muted hover:bg-white"
            }`}
            disabled={isDisabled}
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold leading-5 text-brand-muted">
        {activeReviewMode.description}
      </p>
    </div>
  );
}
