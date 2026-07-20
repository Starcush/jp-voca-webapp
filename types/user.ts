import type { Timestamp } from "firebase/firestore";
import type { Language } from "@/types/language";

export type TextSizePreference = "default" | "large";

export type AppUser = {
  uid: string;
  email?: string;
  username: string;
  defaultLanguage?: Language;
  enabledLanguages?: Language[];
  textSize?: TextSizePreference;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type NewAppUser = Omit<AppUser, "createdAt">;
