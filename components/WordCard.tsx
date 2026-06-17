import Link from "next/link";
import type { Word, WordStatus } from "@/types/word";

type WordCardProps = {
  word: Word;
  maskedField?: "kanji" | "meaning";
  isRevealed?: boolean;
  isUpdatingStudyStatus?: boolean;
  onStudyStatusChange?: (status: WordStatus) => void;
  onToggleReveal?: () => void;
};

function formatLastSeen(word: Word) {
  if (!word.lastSeenAt) {
    return "아직 확인 전";
  }

  return `마지막 확인 ${word.lastSeenAt.toDate().toLocaleDateString("ko-KR")}`;
}

function hasMaskedContent(word: Word, maskedField?: "kanji" | "meaning") {
  if (maskedField === "kanji") {
    return true;
  }

  if (maskedField === "meaning") {
    return Boolean(word.meaning);
  }

  return false;
}

export function WordCard({
  word,
  maskedField,
  isRevealed = false,
  isUpdatingStudyStatus = false,
  onStudyStatusChange,
  onToggleReveal,
}: WordCardProps) {
  const lastSeenLabel = formatLastSeen(word);
  const activeMaskedField = isRevealed ? undefined : maskedField;
  const canToggleReveal = Boolean(
    maskedField && hasMaskedContent(word, maskedField) && onToggleReveal,
  );
  const revealHint = canToggleReveal
    ? isRevealed
      ? "다시 가리기"
      : "눌러서 보기"
    : null;
  const isKnown = word.status === "known";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          aria-label={`${word.kanji} 카드 공개`}
          onClick={maskedField === "kanji" ? onToggleReveal : undefined}
        >
          <div
            className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${
              activeMaskedField === "kanji" ? "blur-sm opacity-45" : ""
            }`}
          >
            <p className="text-lg font-bold leading-7 tracking-normal text-word-kanji">
              {word.kanji}
            </p>
            {word.yomikataFurigana ? (
              <p className="text-xs font-medium leading-5 text-blue-500">
                {word.yomikataFurigana}
              </p>
            ) : null}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {revealHint ? (
            <button
              className="min-h-9 rounded-md bg-slate-100 px-2 text-xs font-bold text-slate-600"
              onClick={onToggleReveal}
              type="button"
            >
              {revealHint}
            </button>
          ) : null}
          <Link
            href={`/words/${word.id}/edit`}
            className="grid min-h-9 place-items-center rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-600"
          >
            수정
          </Link>
        </div>
      </div>

      {word.meaning ? (
        <button
          type="button"
          className="mt-2 w-full text-left"
          aria-label={`${word.kanji} 뜻 공개`}
          onClick={maskedField === "meaning" ? onToggleReveal : undefined}
        >
          <p
            className={`text-sm font-semibold leading-6 text-word-meaning ${
              activeMaskedField === "meaning" ? "blur-sm opacity-45" : ""
            }`}
          >
            {word.meaning}
          </p>
        </button>
      ) : null}

      {word.exampleSentence || word.exampleTranslation ? (
        <button
          type="button"
          className="mt-2 w-full text-left"
          aria-label={`${word.kanji} 예문 공개`}
        >
          {word.exampleSentence ? (
            <p className="overflow-hidden text-xs font-semibold leading-5 text-word-example [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {word.exampleSentence}
            </p>
          ) : null}
          {word.exampleTranslation ? (
            <p className="mt-0.5 overflow-hidden text-xs leading-5 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {word.exampleTranslation}
            </p>
          ) : null}
        </button>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-500">{lastSeenLabel}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            aria-label={`${word.kanji} 알았어요`}
            className={`grid h-9 w-9 place-items-center rounded-md border text-base font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              isKnown
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-200 text-slate-700"
            }`}
            disabled={isUpdatingStudyStatus}
            onClick={() => onStudyStatusChange?.("known")}
            title="알았어요"
            type="button"
          >
            ✓
          </button>
          <button
            aria-label={`${word.kanji} 모르겠어요`}
            className={`grid h-9 w-9 place-items-center rounded-md text-base font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              isKnown ? "bg-slate-950 text-white" : "bg-red-600 text-white"
            }`}
            disabled={isUpdatingStudyStatus}
            onClick={() => onStudyStatusChange?.("unknown")}
            title="모르겠어요"
            type="button"
          >
            ?
          </button>
        </div>
      </div>
    </article>
  );
}
