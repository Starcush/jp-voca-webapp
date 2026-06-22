import type { Language } from "@/types/language";

export type WordSaveNoticeType = "created" | "updated" | "deleted";

type WordSaveNotice = {
  language: Language;
  type: WordSaveNoticeType;
};

const WORD_SAVE_NOTICE_KEY = "jp-voca-word-save-notice";

export function getWordSaveNoticeMessage(type: WordSaveNoticeType) {
  if (type === "created") {
    return "단어를 추가했습니다.";
  }

  if (type === "updated") {
    return "단어를 수정했습니다.";
  }

  return "단어를 삭제했습니다.";
}

export function storeWordSaveNotice(notice: WordSaveNotice) {
  window.sessionStorage.setItem(WORD_SAVE_NOTICE_KEY, JSON.stringify(notice));
}

export function popWordSaveNotice(language: Language) {
  const rawNotice = window.sessionStorage.getItem(WORD_SAVE_NOTICE_KEY);

  if (!rawNotice) {
    return null;
  }

  window.sessionStorage.removeItem(WORD_SAVE_NOTICE_KEY);

  try {
    const notice = JSON.parse(rawNotice) as Partial<WordSaveNotice>;

    if (
      notice.language !== language ||
      (notice.type !== "created" &&
        notice.type !== "updated" &&
        notice.type !== "deleted")
    ) {
      return null;
    }

    return notice.type;
  } catch {
    return null;
  }
}
