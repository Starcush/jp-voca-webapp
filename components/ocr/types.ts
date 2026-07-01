/**
 * OCR 가져오기에서 한 번에 담을 수 있는 추가 예정 표현의 최대 개수입니다.
 */
export const MAX_STAGED_EXPRESSIONS = 10;

/**
 * OCR 가져오기에서 최종 저장 전까지 임시로 들고 있는 표현 데이터입니다.
 *
 * @property id - UI 목록에서 표현을 안정적으로 식별하기 위한 클라이언트 ID입니다.
 * @property term - 사용자가 선택했거나 수정한 단어/표현입니다.
 * @property reading - 일본어 후리가나 또는 중국어 병음입니다. 영어에서는 빈 문자열을 사용합니다.
 * @property meaning - AI 추천 또는 사용자가 입력한 뜻입니다.
 * @property sourceSentence - 표현을 선택한 원문 문장입니다.
 * @property useExample - sourceSentence를 예문으로 저장할지 여부입니다.
 */
export type StagedExpression = {
  id: string;
  meaning: string;
  reading: string;
  sourceSentence: string;
  term: string;
  useExample: boolean;
};
