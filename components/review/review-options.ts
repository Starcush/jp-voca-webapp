/**
 * 한 번의 복습 세트에서 보여줄 최대 단어 수입니다.
 */
export const REVIEW_LIMIT = 20;

/**
 * 복습 카드에서 먼저 보여줄 면을 나타냅니다.
 */
export type ReviewDirection = "termToMeaning" | "meaningToTerm";

/**
 * 복습 화면의 방향 전환 탭 옵션입니다.
 */
export const REVIEW_DIRECTION_OPTIONS: Array<{
  label: string;
  value: ReviewDirection;
}> = [
  { label: "원어 → 뜻", value: "termToMeaning" },
  { label: "뜻 → 원어", value: "meaningToTerm" },
];
