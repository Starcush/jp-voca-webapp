import Link from "next/link";
import { Pencil } from "lucide-react";
import { getWordReading, getWordTerm } from "@/lib/words";
import type { Language } from "@/types/language";
import type { Word } from "@/types/word";

type WordCardProps = {
  activeLanguage: Language;
  isFlagHintVisible?: boolean;
  isFlagUpdating?: boolean;
  isSelected?: boolean;
  maskedField?: "kanji" | "meaning";
  onDismissFlagHint?: () => void;
  onToggleFlag: () => void;
  onToggleSelect?: () => void;
  selectionMode?: boolean;
  word: Word;
};

function getMaskedClass(shouldMask: boolean) {
  return shouldMask ? "blur-sm opacity-45" : "";
}

/**
 * 단어 목록에서 한 단어를 조밀한 행 형태로 렌더링합니다.
 *
 * @param props - 표시할 단어, 선택 상태, 마스킹 상태, 행/점 액션 콜백입니다.
 * @returns 임시 표시 점과 단어 요약 2줄을 가진 목록 행을 렌더링합니다.
 */
export function WordCard({
  activeLanguage,
  isFlagHintVisible = false,
  isFlagUpdating = false,
  isSelected = false,
  maskedField,
  onDismissFlagHint,
  onToggleFlag,
  onToggleSelect,
  selectionMode = false,
  word,
}: WordCardProps) {
  const term = getWordTerm(word);
  const reading = getWordReading(word);
  const isFlagged = Boolean(word.flaggedAt);

  return (
    <article>
      <div
        className={`flex items-start gap-2 border-b border-slate-100 border-l-[3px] px-2 py-2 ${
          isFlagged
            ? "border-l-[oklch(0.7_0.13_85)] bg-[oklch(0.97_0.02_85)]"
            : "border-l-transparent bg-white"
        } ${
          isSelected ? "bg-primary-tint ring-1 ring-primary-border" : ""
        }`}
      >
        {selectionMode ? (
          <label className="grid h-8 w-6 shrink-0 place-items-center">
            <span className="sr-only">{term} 선택</span>
            <input
              checked={isSelected}
              className="rounded border-slate-300 text-primary focus:ring-primary"
              onChange={onToggleSelect}
              type="checkbox"
            />
          </label>
        ) : null}

        <button
          aria-label={
            selectionMode
              ? `${term} 선택`
              : isFlagged
                ? `${term} 헷갈림 표시 해제`
                : `${term} 헷갈림 표시`
          }
          className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectionMode && isFlagUpdating}
          onClick={selectionMode ? onToggleSelect : onToggleFlag}
          type="button"
        >
          <span className="grid h-8 w-6 shrink-0 place-items-center">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full border ${
                isFlagged
                  ? "border-[oklch(0.7_0.13_85)] bg-[oklch(0.45_0.12_85)]"
                  : "border-slate-300 bg-transparent"
              }`}
            />
          </span>
          <span className="grid min-w-0 gap-1">
            <span
              className={`flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 ${getMaskedClass(
                maskedField === "kanji",
              )}`}
            >
              <span className="break-words text-base font-bold leading-5 text-word-kanji">
                {term}
              </span>
              {reading ? (
                <span className="break-words text-xs font-semibold text-primary">
                  {reading}
                </span>
              ) : null}
            </span>
            <span
              className={`break-words text-sm font-medium leading-5 text-word-meaning ${getMaskedClass(
                maskedField === "meaning",
              )}`}
            >
              {word.meaning || "뜻 없음"}
            </span>
            {word.exampleSentence || word.exampleTranslation ? (
              <span
                className={`grid gap-0.5 text-xs font-medium leading-5 text-slate-500 ${getMaskedClass(
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

        {!selectionMode ? (
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            <Link
              aria-label={`${term} 수정`}
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-500"
              href={`/words/${word.id}/edit?lang=${activeLanguage}`}
              title="수정"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
          ) : null}
      </div>
      {isFlagHintVisible ? (
        <div className="relative ml-9 mr-3 mt-1 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-xl">
          <span className="absolute -top-1 left-3 h-3 w-3 rotate-45 bg-slate-950" />
          <p className="text-sm font-bold">단어 옆 점을 탭해보세요</p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-200">
            지금 헷갈리는 단어에 임시 표시를 남길 수 있어요. 이해되면
            다시 탭해서 지우면 돼요. 저장되는 학습 기록이 아니라 잠깐
            훑어볼 때 쓰는 메모예요.
          </p>
          <button
            className="mt-3 min-h-9 rounded-md bg-white px-3 text-sm font-bold text-slate-950"
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
