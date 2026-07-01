import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { NOTEBOOKS_COLLECTION, notebookPath } from "@/lib/firestore-paths";
import type { Language } from "@/types/language";
import type {
  NewNotebookInput,
  Notebook,
  UpdateNotebookInput,
} from "@/types/notebook";

function buildCreateNotebookData(uid: string, input: NewNotebookInput) {
  return {
    description: input.description?.trim() || "",
    language: input.language,
    title: input.title.trim(),
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildUpdateNotebookData(input: UpdateNotebookInput) {
  const hasDescription = Object.prototype.hasOwnProperty.call(
    input,
    "description",
  );

  return {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(hasDescription
      ? { description: input.description?.trim() || deleteField() }
      : {}),
    updatedAt: serverTimestamp(),
  };
}

function getCreatedTime(notebook: Notebook) {
  return notebook.createdAt?.toMillis?.() ?? 0;
}

/**
 * 노트 Firestore 컬렉션 참조를 반환합니다.
 *
 * @returns 타입이 지정된 notebooks 컬렉션 참조입니다.
 */
export function notebooksCollection() {
  return collection(
    getDb(),
    NOTEBOOKS_COLLECTION,
  ) as CollectionReference<Omit<Notebook, "id">>;
}

/**
 * 노트 Firestore 문서 참조를 반환합니다.
 *
 * @param notebookId - 참조할 노트 문서 ID입니다.
 * @returns 타입이 지정된 노트 문서 참조입니다.
 */
export function notebookDocument(notebookId: string) {
  return doc(getDb(), notebookPath(notebookId)) as DocumentReference<
    Omit<Notebook, "id">
  >;
}

/**
 * 사용자의 특정 언어 노트 목록을 생성일 역순으로 조회합니다.
 *
 * @param uid - 노트를 소유한 사용자 ID입니다.
 * @param language - 조회할 노트 언어입니다.
 * @returns 해당 언어의 노트 목록을 반환합니다.
 */
export async function listNotebooks(uid: string, language: Language) {
  const snapshot = await getDocs(
    query(
      notebooksCollection(),
      where("uid", "==", uid),
    ),
  );

  return snapshot.docs
    .map((notebookSnapshot) => ({
      id: notebookSnapshot.id,
      ...notebookSnapshot.data(),
    }))
    .filter((notebook) => notebook.language === language)
    .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
}

/**
 * 노트 ID로 단일 노트를 조회합니다.
 *
 * @param notebookId - 조회할 노트 문서 ID입니다.
 * @returns 노트가 있으면 노트 데이터를, 없으면 null을 반환합니다.
 */
export async function getNotebook(notebookId: string) {
  const snapshot = await getDoc(notebookDocument(notebookId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * 새 노트를 생성합니다.
 *
 * @param uid - 노트를 소유할 사용자 ID입니다.
 * @param input - 새 노트 생성 입력값입니다.
 * @returns 생성된 노트 문서 ID를 반환합니다.
 */
export async function createNotebook(uid: string, input: NewNotebookInput) {
  const notebookRef = await addDoc(
    notebooksCollection(),
    buildCreateNotebookData(uid, input),
  );

  return notebookRef.id;
}

/**
 * 기존 노트의 이름 또는 설명을 수정합니다.
 *
 * @param notebookId - 수정할 노트 문서 ID입니다.
 * @param input - 변경할 노트 입력값입니다.
 * @returns 수정이 완료되면 resolve됩니다.
 */
export async function updateNotebook(
  notebookId: string,
  input: UpdateNotebookInput,
) {
  await updateDoc(notebookDocument(notebookId), buildUpdateNotebookData(input));
}

/**
 * 노트 문서를 삭제합니다.
 *
 * @param notebookId - 삭제할 노트 문서 ID입니다.
 * @returns 삭제가 완료되면 resolve됩니다.
 */
export async function deleteNotebook(notebookId: string) {
  await deleteDoc(notebookDocument(notebookId));
}
