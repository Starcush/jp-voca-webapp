import type { Timestamp } from "firebase/firestore";

export type WordStatus = "unknown" | "known";

export type Word = {
  id: string;
  uid: string;
  kanji: string;
  yomikataFurigana?: string;
  meaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  status: WordStatus;
  lastSeenAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type NewWordInput = {
  kanji: string;
  yomikataFurigana?: string;
  meaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
};

export type UpdateWordInput = Partial<NewWordInput> & {
  status?: WordStatus;
  lastSeenAt?: Timestamp | null;
};
