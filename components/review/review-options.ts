import type { ReviewMode } from "@/components/review/types";

/**
 * 한 번의 복습 세트에서 보여줄 최대 단어 수입니다.
 */
export const REVIEW_LIMIT = 20;

/**
 * 복습 화면에서 사용할 모드 탭 옵션입니다.
 */
export const reviewModes: Array<{
  description: string;
  label: string;
  value: ReviewMode;
}> = [
  {
    description: "모르는 단어와 오래 안 본 단어를 우선 확인합니다.",
    label: "추천",
    value: "priority",
  },
  {
    description: "모르겠어요로 남아 있는 단어만 확인합니다.",
    label: "모르는 단어",
    value: "unknown",
  },
  {
    description: "최근에 덜 본 단어부터 다시 확인합니다.",
    label: "오래 안 본 단어",
    value: "stale",
  },
  {
    description: "저장된 단어를 무작위로 섞어 확인합니다.",
    label: "전체 섞기",
    value: "random",
  },
];
