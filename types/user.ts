import type { Timestamp } from "firebase/firestore";

export type AppUser = {
  uid: string;
  email?: string;
  username: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type NewAppUser = Omit<AppUser, "createdAt">;
