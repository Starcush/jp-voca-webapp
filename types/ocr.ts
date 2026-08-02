/**
 * OCR 결과를 조립할 때 사용할 읽기 방향입니다.
 */
export type OcrReadingDirection = "auto" | "horizontal" | "vertical-rl";

/**
 * OCR이 인식한 사진 위 텍스트 영역입니다.
 *
 * @property height - 이미지 높이를 1로 봤을 때의 상대 높이입니다.
 * @property id - 클라이언트 선택 상태를 구분하기 위한 안정적인 토큰 ID입니다.
 * @property pageIndex - Google Vision 문서 OCR 기준 페이지 순서입니다.
 * @property readingOrder - Document AI가 판단한 전체 텍스트 읽기 순서입니다.
 * @property sentenceId - 같은 문장으로 선택할 OCR 영역을 묶는 그룹 ID입니다.
 * @property text - 해당 영역에서 인식된 텍스트입니다.
 * @property width - 이미지 너비를 1로 봤을 때의 상대 너비입니다.
 * @property x - 이미지 왼쪽을 0으로 봤을 때의 상대 x 좌표입니다.
 * @property y - 이미지 위쪽을 0으로 봤을 때의 상대 y 좌표입니다.
 */
export type OcrTextBox = {
  height: number;
  id: string;
  pageIndex: number;
  readingOrder: number;
  sentenceId: string;
  text: string;
  width: number;
  x: number;
  y: number;
};

/**
 * OCR API가 반환하는 텍스트와 사진 위 선택용 레이아웃 정보입니다.
 *
 * @property text - 기존 OCR 플로우에서 사용하는 추출 텍스트입니다.
 * @property tokens - 사진 위에 overlay 할 단어 좌표와 문장 그룹 정보입니다.
 */
export type OcrExtractionResult = {
  text: string;
  tokens: OcrTextBox[];
};
