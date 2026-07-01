import { createHash } from "node:crypto";
import { GoogleAuth } from "google-auth-library";
import { getGoogleCloudCredentials } from "@/lib/google-cloud-credentials";
import type { Language } from "@/types/language";

type FirestoreValue =
  | { integerValue: string }
  | { stringValue: string }
  | { timestampValue: string };

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

export type MeaningCacheEntry = {
  language: Language;
  meaning: string;
  normalizedTerm: string;
  reading?: string;
  source: "ai";
  term: string;
};

const MEANING_CACHE_COLLECTION = "meaningCache";
const firestoreScope = "https://www.googleapis.com/auth/datastore";

let googleAuth: GoogleAuth | undefined;

export function normalizeMeaningTerm(term: string) {
  return term.replace(/\s+/g, " ").trim().toLowerCase();
}

function getMeaningCacheId(language: Language, normalizedTerm: string) {
  return createHash("sha256")
    .update(`${language}:${normalizedTerm}`)
    .digest("hex");
}

function getProjectId() {
  return (
    getGoogleCloudCredentials()?.project_id ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

function getGoogleAuth() {
  if (googleAuth) {
    return googleAuth;
  }

  googleAuth = new GoogleAuth({
    credentials: getGoogleCloudCredentials(),
    scopes: [firestoreScope],
  });

  return googleAuth;
}

async function getAuthHeaders(url: string) {
  const client = await getGoogleAuth().getClient();
  const headers = await client.getRequestHeaders(url);

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, String(value)]),
  );
}

function getDocumentUrl(language: Language, normalizedTerm: string) {
  const projectId = getProjectId();

  if (!projectId) {
    throw new Error("Google Cloud project id is required.");
  }

  const documentId = getMeaningCacheId(language, normalizedTerm);

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${MEANING_CACHE_COLLECTION}/${documentId}`;
}

function getStringField(document: FirestoreDocument, field: string) {
  const value = document.fields?.[field];

  return value && "stringValue" in value ? value.stringValue : "";
}

function getIntegerField(document: FirestoreDocument, field: string) {
  const value = document.fields?.[field];

  if (!value || !("integerValue" in value)) {
    return 0;
  }

  return Number.parseInt(value.integerValue, 10) || 0;
}

function toCacheEntry(document: FirestoreDocument): MeaningCacheEntry | null {
  const language = getStringField(document, "language") as Language;
  const term = getStringField(document, "term");
  const normalizedTerm = getStringField(document, "normalizedTerm");
  const meaning = getStringField(document, "meaning");
  const reading = getStringField(document, "reading");

  if (!language || !term || !normalizedTerm || !meaning) {
    return null;
  }

  return {
    language,
    meaning,
    normalizedTerm,
    reading: reading || undefined,
    source: "ai",
    term,
  };
}

export async function getMeaningCache(
  language: Language,
  normalizedTerm: string,
) {
  const url = getDocumentUrl(language, normalizedTerm);
  const response = await fetch(url, {
    headers: await getAuthHeaders(url),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to read meaning cache.");
  }

  return toCacheEntry((await response.json()) as FirestoreDocument);
}

async function getMeaningCacheDocument(
  language: Language,
  normalizedTerm: string,
) {
  const url = getDocumentUrl(language, normalizedTerm);
  const response = await fetch(url, {
    headers: await getAuthHeaders(url),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to read meaning cache.");
  }

  return (await response.json()) as FirestoreDocument;
}

export async function setMeaningCache(entry: MeaningCacheEntry) {
  const url = getDocumentUrl(entry.language, entry.normalizedTerm);
  const now = new Date().toISOString();
  const fields: Record<string, FirestoreValue> = {
    createdAt: { timestampValue: now },
    language: { stringValue: entry.language },
    meaning: { stringValue: entry.meaning },
    normalizedTerm: { stringValue: entry.normalizedTerm },
    source: { stringValue: entry.source },
    savedCount: { integerValue: "0" },
    term: { stringValue: entry.term },
    updatedAt: { timestampValue: now },
    usageCount: { integerValue: "1" },
  };

  if (entry.reading) {
    fields.reading = { stringValue: entry.reading };
  }

  const response = await fetch(url, {
    body: JSON.stringify({ fields }),
    headers: {
      ...(await getAuthHeaders(url)),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to write meaning cache.");
  }
}

export async function incrementMeaningSavedCount({
  language,
  meaning,
  normalizedTerm,
  reading,
  term,
}: {
  language: Language;
  meaning?: string;
  normalizedTerm: string;
  reading?: string;
  term: string;
}) {
  const document = await getMeaningCacheDocument(language, normalizedTerm);
  const url = getDocumentUrl(language, normalizedTerm);
  const now = new Date().toISOString();

  if (!document) {
    const fields: Record<string, FirestoreValue> = {
      createdAt: { timestampValue: now },
      language: { stringValue: language },
      meaning: { stringValue: meaning ?? "" },
      normalizedTerm: { stringValue: normalizedTerm },
      savedCount: { integerValue: "1" },
      source: { stringValue: "ai" },
      term: { stringValue: term },
      updatedAt: { timestampValue: now },
      usageCount: { integerValue: "0" },
    };

    if (reading) {
      fields.reading = { stringValue: reading };
    }

    const response = await fetch(url, {
      body: JSON.stringify({ fields }),
      headers: {
        ...(await getAuthHeaders(url)),
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error("Failed to create meaning save count.");
    }

    return;
  }

  const savedCount = getIntegerField(document, "savedCount") + 1;
  const response = await fetch(
    `${url}?updateMask.fieldPaths=savedCount&updateMask.fieldPaths=updatedAt`,
    {
      body: JSON.stringify({
        fields: {
          savedCount: { integerValue: String(savedCount) },
          updatedAt: { timestampValue: now },
        },
      }),
      headers: {
        ...(await getAuthHeaders(url)),
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update meaning save count.");
  }
}
