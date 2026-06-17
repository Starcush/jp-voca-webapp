import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseEnv } from "@/lib/env";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

export function getFirebaseApp() {
  if (app) {
    return app;
  }

  app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseEnv());
  return app;
}

export function getDb() {
  if (firestore) {
    return firestore;
  }

  firestore = getFirestore(getFirebaseApp());
  return firestore;
}

export function getFirebaseAuth() {
  if (auth) {
    return auth;
  }

  auth = getAuth(getFirebaseApp());
  return auth;
}
