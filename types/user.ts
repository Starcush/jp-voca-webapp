import type { Timestamp } from "firebase/firestore";
import type { Language } from "@/types/language";

export type AppUser = {
  uid: string;
  email?: string;
  username: string;
  defaultLanguage?: Language;
  enabledLanguages?: Language[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type NewAppUser = Omit<AppUser, "createdAt">;
