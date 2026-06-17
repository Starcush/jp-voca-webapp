import Link from "next/link";
import type { Word } from "@/types/word";

type WordCardProps = {
  word: Word;
  maskedField?: "kanji" | "meaning" | "example";
  isRevealed?: boolean;
  onToggleReveal?: () => void;
};

function formatLastSeen(word: Word) {
  if (!word.lastSeenAt) {
    return "아직 확인 전";
  }

  return `마지막 확인 ${word.lastSeenAt.toDate().toLocaleDateString("ko-KR")}`;
}

function hasMaskedContent(word: Word, maskedField?: "kanji" | "meaning" | "example") {
  if (maskedField === "kanji") {
    return true;
  }

  if (maskedField === "meaning") {
    return Boolean(word.meaning);
  }

  if (maskedField === "example") {
    return Boolean(word.exampleSentence || word.exampleTranslation);
  }

  return false;
}

export function WordCard({
  word,
  maskedField,
  isRevealed = false,
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

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          aria-label={`${word.kanji} 카드 공개`}
          onClick={maskedField === "kanji" ? onToggleReveal : undefined}
        >
          <p
            className={`text-xl font-bold tracking-normal text-word-kanji ${
              activeMaskedField === "kanji" ? "blur-sm opacity-45" : ""
            }`}
          >
            {word.kanji}
          </p>
          {word.yomikataFurigana ? (
            <p
              className={`mt-1 text-sm font-medium text-blue-500 ${
                activeMaskedField === "kanji" ? "blur-sm opacity-45" : ""
              }`}
            >
              {word.yomikataFurigana}
            </p>
          ) : null}
        </button>
        <Link
          href={`/words/${word.id}/edit`}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          수정
        </Link>
      </div>

      {word.meaning ? (
        <button
          type="button"
          className="mt-4 w-full text-left"
          aria-label={`${word.kanji} 뜻 공개`}
          onClick={maskedField === "meaning" ? onToggleReveal : undefined}
        >
          <p
            className={`text-base font-semibold text-word-meaning ${
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
          className="mt-4 w-full text-left"
          aria-label={`${word.kanji} 예문 공개`}
          onClick={maskedField === "example" ? onToggleReveal : undefined}
        >
          {word.exampleSentence ? (
            <p
              className={`text-sm font-semibold leading-6 text-word-example ${
                activeMaskedField === "example" ? "blur-sm opacity-45" : ""
              }`}
            >
              {word.exampleSentence}
            </p>
          ) : null}
          {word.exampleTranslation ? (
            <p
              className={`mt-1 text-sm leading-6 text-slate-500 ${
                activeMaskedField === "example" ? "blur-sm opacity-45" : ""
              }`}
            >
              {word.exampleTranslation}
            </p>
          ) : null}
        </button>
      ) : null}

      {revealHint ? (
        <button
          className="mt-4 min-h-10 w-full rounded-md bg-slate-100 text-sm font-bold text-slate-600"
          onClick={onToggleReveal}
          type="button"
        >
          {revealHint}
        </button>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-500">{lastSeenLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="min-h-11 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
            알았어요
          </button>
          <button className="min-h-11 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white">
            모르겠어요
          </button>
        </div>
      </div>
    </article>
  );
}
