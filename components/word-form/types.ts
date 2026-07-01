/**
 * 단어 생성/수정 폼의 입력 상태입니다.
 *
 * @property term - 필수 단어/표현 입력값입니다.
 * @property reading - 선택 읽기 입력값입니다.
 * @property meaning - 선택 뜻 입력값입니다.
 * @property exampleSentence - 선택 예문 입력값입니다.
 * @property exampleTranslation - 선택 예문 번역 입력값입니다.
 */
export type WordFormState = {
  term: string;
  reading: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
};

/**
 * 단어 폼에서 수정할 수 있는 필드 이름입니다.
 */
export type WordFormField = keyof WordFormState;
