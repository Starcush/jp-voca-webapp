import type { Timestamp } from "firebase/firestore";
import type { Language } from "@/types/language";

export type WordStatus = "unknown" | "known";
export type WordFsrsState = 0 | 1 | 2 | 3;

export type Word = {
  id: string;
  uid: string;
  language?: Language;
  term?: string;
  reading?: string;
  notebookId?: string;
  kanji?: string;
  yomikataFurigana?: string;
  meaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  status: WordStatus;
  lastSeenAt: Timestamp | null;
  flaggedAt: Timestamp | null;
  fsrsDueAt?: Timestamp | null;
  fsrsStability?: number | null;
  fsrsDifficulty?: number | null;
  fsrsElapsedDays?: number | null;
  fsrsScheduledDays?: number | null;
  fsrsLearningSteps?: number | null;
  fsrsReps?: number | null;
  fsrsLapses?: number | null;
  fsrsState?: WordFsrsState | null;
  fsrsLastReviewAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type NewWordInput = {
  language: Language;
  term: string;
  reading?: string;
  notebookId?: string;
  meaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
};

export type UpdateWordInput = Partial<Omit<NewWordInput, "notebookId">> & {
  notebookId?: string | null;
  status?: WordStatus;
  lastSeenAt?: Timestamp | null;
  flaggedAt?: Timestamp | null;
  fsrsDueAt?: Timestamp | null;
  fsrsStability?: number | null;
  fsrsDifficulty?: number | null;
  fsrsElapsedDays?: number | null;
  fsrsScheduledDays?: number | null;
  fsrsLearningSteps?: number | null;
  fsrsReps?: number | null;
  fsrsLapses?: number | null;
  fsrsState?: WordFsrsState | null;
  fsrsLastReviewAt?: Timestamp | null;
};
