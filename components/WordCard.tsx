import Link from "next/link";
import { Pencil } from "lucide-react";
import { getWordReading, getWordTerm } from "@/lib/words";
import type { Language } from "@/types/language";
import type { Word } from "@/types/word";

type WordCardProps = {
  activeLanguage: Language;
  isFlagHintVisible?: boolean;
  isFlagUpdating?: boolean;
  maskedField?: "kanji" | "meaning";
  onDismissFlagHint?: () => void;
  onToggleFlag: () => void;
  word: Word;
};

function getMaskedClass(shouldMask: boolean) {
  return shouldMask ? "blur-sm opacity-45" : "";
}

/**
 * 단어 목록에서 한 단어를 조밀한 행 형태로 렌더링합니다.
 *
 * @param props - 표시할 단어, 마스킹 상태, 행/점 액션 콜백입니다.
 * @returns 임시 표시 점과 단어 요약 2줄을 가진 목록 행을 렌더링합니다.
 */
export function WordCard({
  activeLanguage,
  isFlagHintVisible = false,
  isFlagUpdating = false,
  maskedField,
  onDismissFlagHint,
  onToggleFlag,
  word,
}: WordCardProps) {
  const term = getWordTerm(word);
  const reading = getWordReading(word);
  const isFlagged = Boolean(word.flaggedAt);
  const languageTextClass = activeLanguage === "ja" ? "font-japanese" : "";
  const meaningTextClass =
    activeLanguage === "en" ? "text-primary-text" : "text-word-meaning";

  return (
    <article>
      <div
        className={`flex items-start gap-2 rounded-xl py-3 transition-colors ${
          isFlagged
            ? "bg-white px-3 shadow-[0_3px_10px_rgba(36,28,61,0.12)] ring-1 ring-brand-flag/45"
            : "bg-white px-3 shadow-[0_1px_3px_rgba(36,28,61,0.06)]"
        }`}
      >
        <button
          aria-label={
            isFlagged
              ? `${term} 헷갈림 표시 해제`
              : `${term} 헷갈림 표시`
          }
          className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isFlagUpdating}
          onClick={onToggleFlag}
          type="button"
        >
          <span className="grid h-8 w-6 shrink-0 place-items-center">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full border ${
                isFlagged
                  ? "border-brand-flag bg-brand-flag"
                  : "border-brand-border-strong bg-transparent"
              }`}
            />
          </span>
          <span className="grid min-w-0 gap-1">
            <span
              className={`flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 ${getMaskedClass(
                maskedField === "kanji",
              )}`}
            >
              <span
                className={`break-words text-[1.0625rem] font-semibold leading-6 text-word-kanji ${languageTextClass}`}
              >
                {term}
              </span>
              {reading ? (
                <span
                  className={`break-words text-xs font-semibold text-primary-text ${languageTextClass}`}
                >
                  {reading}
                </span>
              ) : null}
            </span>
            <span
              className={`break-words text-[0.8125rem] font-medium leading-5 ${meaningTextClass} ${getMaskedClass(
                maskedField === "meaning",
              )}`}
            >
              {word.meaning || "뜻 없음"}
            </span>
            {word.exampleSentence || word.exampleTranslation ? (
              <span
                className={`grid gap-0.5 text-xs font-normal leading-5 text-word-example ${getMaskedClass(
                  Boolean(maskedField),
                )}`}
              >
                {word.exampleSentence ? (
                  <span className="break-words">{word.exampleSentence}</span>
                ) : null}
                {word.exampleTranslation ? (
                  <span className="break-words">{word.exampleTranslation}</span>
                ) : null}
              </span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          <Link
            aria-label={`${term} 수정`}
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500"
            href={`/words/${word.id}/edit?lang=${activeLanguage}`}
            title="수정"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
      {isFlagHintVisible ? (
        <div className="relative ml-9 mr-3 mt-2 rounded-xl bg-brand-text px-4 py-3 text-white shadow-xl">
          <span className="absolute -top-1 left-3 h-3 w-3 rotate-45 bg-brand-text" />
          <p className="text-sm font-bold">단어 옆 점을 탭해보세요</p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-200">
            지금 헷갈리는 단어에 임시 표시를 남길 수 있어요. 이해되면
            다시 탭해서 지우면 돼요. 저장되는 학습 기록이 아니라 잠깐
            훑어볼 때 쓰는 메모예요.
          </p>
          <button
            className="mt-3 min-h-9 rounded-md bg-white px-3 text-sm font-bold text-brand-text"
            onClick={onDismissFlagHint}
            type="button"
          >
            알겠어요
          </button>
        </div>
      ) : null}
    </article>
  );
}
