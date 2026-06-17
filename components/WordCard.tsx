import Link from "next/link";

export type WordCardData = {
  id: string;
  kanji: string;
  yomikataFurigana: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation?: string;
  status: "known" | "unknown";
  lastSeenLabel: string;
};

type WordCardProps = {
  word: WordCardData;
  maskedField?: "kanji" | "meaning" | "example";
};

export function WordCard({ word, maskedField }: WordCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          aria-label={`${word.kanji} 카드 공개`}
        >
          <p
            className={`text-xl font-bold tracking-normal text-word-kanji ${
              maskedField === "kanji" ? "blur-sm opacity-45" : ""
            }`}
          >
            {word.kanji}
          </p>
          <p
            className={`mt-1 text-sm font-medium text-blue-500 ${
              maskedField === "kanji" ? "blur-sm opacity-45" : ""
            }`}
          >
            {word.yomikataFurigana}
          </p>
        </button>
        <Link
          href={`/words/${word.id}/edit`}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          수정
        </Link>
      </div>

      <button
        type="button"
        className="mt-4 w-full text-left"
        aria-label={`${word.kanji} 뜻 공개`}
      >
        <p
          className={`text-base font-semibold text-word-meaning ${
            maskedField === "meaning" ? "blur-sm opacity-45" : ""
          }`}
        >
          {word.meaning}
        </p>
      </button>

      <button
        type="button"
        className="mt-4 w-full text-left"
        aria-label={`${word.kanji} 예문 공개`}
      >
        <p
          className={`text-sm font-semibold leading-6 text-word-example ${
            maskedField === "example" ? "blur-sm opacity-45" : ""
          }`}
        >
          {word.exampleSentence}
        </p>
        {word.exampleTranslation ? (
          <p
            className={`mt-1 text-sm leading-6 text-slate-500 ${
              maskedField === "example" ? "blur-sm opacity-45" : ""
            }`}
          >
            {word.exampleTranslation}
          </p>
        ) : null}
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-500">{word.lastSeenLabel}</p>
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

