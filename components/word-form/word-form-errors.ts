/**
 * 단어 폼에서 에러 메시지를 구분할 작업 종류입니다.
 */
export type WordFormErrorAction = "load" | "save" | "delete";

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

/**
 * 단어 폼에서 발생한 Firestore 작업 에러를 사용자용 메시지로 변환합니다.
 *
 * @param error - Firestore 또는 앱 로직에서 발생한 에러입니다.
 * @param action - 에러가 발생한 단어 폼 작업 종류입니다.
 * @returns 사용자에게 보여줄 한국어 에러 메시지를 반환합니다.
 */
export function getWordFormErrorMessage(
  error: unknown,
  action: WordFormErrorAction,
) {
  const code = getFirebaseErrorCode(error);

  if (code === "permission-denied") {
    return "Firestore 권한이 부족합니다. Firebase Rules가 배포 환경의 프로젝트에 반영됐는지 확인해주세요.";
  }

  if (code === "not-found") {
    return "단어를 찾을 수 없습니다. 이미 삭제됐거나 접근할 수 없는 단어일 수 있습니다.";
  }

  if (code === "unavailable") {
    return "Firestore에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.";
  }

  if (code === "invalid-argument") {
    return "저장할 수 없는 값이 포함되어 있습니다. 입력값을 확인한 뒤 다시 시도해주세요.";
  }

  if (action === "load") {
    return "단어를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (action === "delete") {
    return "단어를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  return "단어를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.";
}
