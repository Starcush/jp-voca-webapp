import type { Timestamp } from "firebase/firestore";
import type { Language } from "@/types/language";

/**
 * 사용자가 언어별로 단어를 묶어 관리하는 노트 데이터입니다.
 *
 * @property id - Firestore 문서 ID입니다.
 * @property uid - 노트를 소유한 사용자 ID입니다.
 * @property language - 노트가 속한 언어입니다.
 * @property title - 사용자에게 표시할 노트 이름입니다.
 * @property description - 선택 설명입니다.
 * @property createdAt - 노트 생성 시각입니다.
 * @property updatedAt - 노트 마지막 수정 시각입니다.
 */
export type Notebook = {
  id: string;
  uid: string;
  language: Language;
  title: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * 새 노트를 만들 때 필요한 입력값입니다.
 *
 * @property language - 노트를 만들 언어입니다.
 * @property title - 노트 이름입니다.
 * @property description - 선택 설명입니다.
 */
export type NewNotebookInput = {
  language: Language;
  title: string;
  description?: string;
};

/**
 * 기존 노트를 수정할 때 사용할 입력값입니다.
 *
 * @property title - 변경할 노트 이름입니다.
 * @property description - 변경할 선택 설명입니다. 빈 값이면 설명을 제거합니다.
 */
export type UpdateNotebookInput = {
  title?: string;
  description?: string | null;
};
