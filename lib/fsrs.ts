import { Timestamp } from "firebase/firestore";
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { UpdateWordInput, Word, WordStatus } from "@/types/word";

type WordFsrsUpdate = Required<
  Pick<
    UpdateWordInput,
    | "fsrsDifficulty"
    | "fsrsDueAt"
    | "fsrsElapsedDays"
    | "fsrsLapses"
    | "fsrsLastReviewAt"
    | "fsrsLearningSteps"
    | "fsrsReps"
    | "fsrsScheduledDays"
    | "fsrsStability"
    | "fsrsState"
  >
>;

const scheduler = fsrs();

function timestampToDate(timestamp?: Timestamp | null) {
  return timestamp?.toDate?.();
}

function timestampToTime(timestamp?: Timestamp | null) {
  return timestamp?.toMillis?.() ?? 0;
}

function serializeFsrsCard(card: Card): WordFsrsUpdate {
  return {
    fsrsDifficulty: card.difficulty,
    fsrsDueAt: Timestamp.fromDate(card.due),
    fsrsElapsedDays: card.elapsed_days,
    fsrsLapses: card.lapses,
    fsrsLastReviewAt: card.last_review
      ? Timestamp.fromDate(card.last_review)
      : null,
    fsrsLearningSteps: card.learning_steps,
    fsrsReps: card.reps,
    fsrsScheduledDays: card.scheduled_days,
    fsrsStability: card.stability,
    fsrsState: card.state,
  };
}

/**
 * 새 단어가 생성될 때 저장할 FSRS 기본 필드를 만듭니다.
 *
 * @param now - 새 카드의 기준 시각입니다.
 * @returns Firestore 단어 문서에 저장할 FSRS 초기 필드입니다.
 */
export function createInitialFsrsWordFields(now = new Date()) {
  return serializeFsrsCard(createEmptyCard(now));
}

/**
 * 단어 문서의 FSRS 필드를 ts-fsrs 카드 객체로 변환합니다.
 *
 * @param word - 복습할 단어입니다. FSRS 필드가 없으면 새 카드로 간주합니다.
 * @param now - 기본 due 시각으로 사용할 기준 시각입니다.
 * @returns ts-fsrs 스케줄러에 전달할 카드 객체입니다.
 */
export function getFsrsCardFromWord(word: Word, now = new Date()): Card {
  const fallbackCard = createEmptyCard(
    timestampToDate(word.createdAt) ?? now,
  );

  return {
    difficulty: word.fsrsDifficulty ?? fallbackCard.difficulty,
    due: timestampToDate(word.fsrsDueAt) ?? now,
    elapsed_days: word.fsrsElapsedDays ?? fallbackCard.elapsed_days,
    lapses: word.fsrsLapses ?? fallbackCard.lapses,
    last_review:
      timestampToDate(word.fsrsLastReviewAt) ?? fallbackCard.last_review,
    learning_steps: word.fsrsLearningSteps ?? fallbackCard.learning_steps,
    reps: word.fsrsReps ?? fallbackCard.reps,
    scheduled_days: word.fsrsScheduledDays ?? fallbackCard.scheduled_days,
    stability: word.fsrsStability ?? fallbackCard.stability,
    state: word.fsrsState ?? fallbackCard.state,
  };
}

/**
 * 단어가 현재 복습 대상인지 확인합니다.
 *
 * @param word - 복습 후보 단어입니다.
 * @param now - due 판단 기준 시각입니다.
 * @returns FSRS due 시각이 현재 이전이면 true입니다. 기존 단어처럼 due가 없으면 true입니다.
 */
export function isFsrsWordDue(word: Word, now = new Date()) {
  const dueTime = timestampToTime(word.fsrsDueAt);

  return dueTime === 0 || dueTime <= now.getTime();
}

/**
 * 복습 후보 정렬에 사용할 due 시각을 반환합니다.
 *
 * @param word - 정렬할 단어입니다.
 * @returns FSRS due 시각입니다. 기존 단어처럼 due가 없으면 가장 먼저 나오도록 0을 반환합니다.
 */
export function getFsrsDueTime(word: Word) {
  return timestampToTime(word.fsrsDueAt);
}

/**
 * 현재 판정 결과를 FSRS 스케줄에 적용해 단어 업데이트 필드를 만듭니다.
 *
 * @param word - 복습 판정을 적용할 단어입니다.
 * @param status - 앱의 단순 판정입니다. unknown은 Again, known은 Good으로 매핑합니다.
 * @param now - 복습 판정 기준 시각입니다.
 * @returns 단어 문서에 저장할 학습 상태와 FSRS 필드입니다.
 */
export function buildFsrsStudyUpdate(
  word: Word,
  status: WordStatus,
  now = new Date(),
) {
  const rating: Grade = status === "known" ? Rating.Good : Rating.Again;
  const nextReview = scheduler.next(getFsrsCardFromWord(word, now), now, rating);

  return {
    ...serializeFsrsCard(nextReview.card),
    lastSeenAt: Timestamp.fromDate(now),
    status,
  };
}
