"use client";

import {
  getExamplePlaceholder,
  getMeaningPlaceholder,
  getReadingPlaceholder,
  getTermPlaceholder,
} from "@/components/word-form/word-form-placeholders";
import type { WordFormState } from "@/components/word-form/types";
import { useWordFormQuery } from "@/components/word-form/useWordFormQuery";
import { useWordFormState } from "@/components/word-form/useWordFormState";
import { getLanguageOption } from "@/lib/languages";
import type { AppSession } from "@/lib/session";
import { getWordReading, getWordTerm } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { Word } from "@/types/word";

type WordFormProps = {
  language: Language;
  mode: "create" | "edit";
  notebookId?: string;
  wordId?: string;
};

type WordFormBodyProps = WordFormProps & {
  initialForm: WordFormState;
  loadErrorMessage: string;
  session: AppSession | null;
};

const emptyForm: WordFormState = {
  term: "",
  reading: "",
  meaning: "",
  exampleSentence: "",
  exampleTranslation: "",
};

function toFormState(word: Word): WordFormState {
  return {
    term: getWordTerm(word),
    reading: getWordReading(word),
    meaning: word.meaning ?? "",
    exampleSentence: word.exampleSentence ?? "",
    exampleTranslation: word.exampleTranslation ?? "",
  };
}

/**
 * 단어 생성/수정 입력 폼을 렌더링합니다.
 *
 * @param props - 단어 폼에 필요한 모드와 언어 정보입니다.
 * @param props.language - 저장할 단어의 언어입니다.
 * @param props.mode - 생성 또는 수정 모드입니다.
 * @param props.notebookId - 생성 모드에서 저장할 노트 ID입니다.
 * @param props.wordId - 수정 모드에서 불러올 단어 ID입니다.
 * @returns 단어 입력 필드, 자동 읽기 생성, 저장/삭제 액션을 렌더링합니다.
 */
export function WordForm({ language, mode, notebookId, wordId }: WordFormProps) {
  const session = useSession() ?? null;
  const isEdit = mode === "edit";
  const {
    errorMessage: loadErrorMessage,
    isLoading,
    word,
  } = useWordFormQuery({
    isEdit,
    uid: session?.uid,
    wordId,
  });

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">단어를 불러오는 중</p>
      </section>
    );
  }

  return (
    <WordFormBody
      initialForm={word ? toFormState(word) : emptyForm}
      key={word?.id ?? `${mode}-${language}-${wordId ?? "new"}`}
      language={language}
      loadErrorMessage={loadErrorMessage}
      mode={mode}
      notebookId={notebookId}
      session={session}
      wordId={wordId}
    />
  );
}

function WordFormBody({
  initialForm,
  language,
  loadErrorMessage,
  mode,
  notebookId,
  session,
  wordId,
}: WordFormBodyProps) {
  const isEdit = mode === "edit";
  const languageOption = getLanguageOption(language);
  const canAutoGenerateReading = language === "ja" || language === "zh";
  const {
    errorMessage,
    form,
    handleDelete,
    handleGenerateReading,
    handleSubmit,
    isGeneratingReading,
    isSubmitting,
    updateField,
  } = useWordFormState({
    initialForm,
    isEdit,
    language,
    notebookId,
    session,
    termLabel: languageOption.termLabel,
    wordId,
  });

  return (
    <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {languageOption.termLabel}
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-600">
            필수
          </span>
        </span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => updateField("term", event.target.value)}
          placeholder={getTermPlaceholder(language)}
          required
          value={form.term}
        />
      </label>

      {languageOption.readingLabel ? (
        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            {languageOption.readingLabel}
            <span className="text-xs font-semibold text-slate-400">선택</span>
          </span>
          <div
            className={
              canAutoGenerateReading ? "grid grid-cols-[1fr_auto] gap-2" : "grid"
            }
          >
            <input
              className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
              onChange={(event) => updateField("reading", event.target.value)}
              placeholder={getReadingPlaceholder(language)}
              value={form.reading}
            />
            {canAutoGenerateReading ? (
              <button
                className="min-h-12 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isGeneratingReading || isSubmitting || !form.term.trim()}
                onClick={handleGenerateReading}
                type="button"
              >
                {isGeneratingReading ? "생성 중" : "자동 생성"}
              </button>
            ) : null}
          </div>
        </label>
      ) : null}

      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          뜻
          <span className="text-xs font-semibold text-slate-400">선택</span>
        </span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => updateField("meaning", event.target.value)}
          placeholder={getMeaningPlaceholder(language)}
          value={form.meaning}
        />
      </label>

      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          예문
          <span className="text-xs font-semibold text-slate-400">선택</span>
        </span>
        <textarea
          className="min-h-28 rounded-lg border-slate-200 bg-white text-base leading-6"
          onChange={(event) => updateField("exampleSentence", event.target.value)}
          placeholder={getExamplePlaceholder(language)}
          value={form.exampleSentence}
        />
      </label>

      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          예문 번역
          <span className="text-xs font-semibold text-slate-400">선택</span>
        </span>
        <textarea
          className="min-h-24 rounded-lg border-slate-200 bg-white text-base leading-6"
          onChange={(event) =>
            updateField("exampleTranslation", event.target.value)
          }
          placeholder="아침밥을 먹다."
          value={form.exampleTranslation}
        />
      </label>

      {errorMessage || loadErrorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage || loadErrorMessage}
        </p>
      ) : null}

      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
        <button
          className="min-h-12 rounded-lg bg-slate-950 px-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "저장 중" : "저장"}
        </button>
        {isEdit ? (
          <button
            className="min-h-12 rounded-lg border border-red-200 px-4 text-base font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            onClick={handleDelete}
            type="button"
          >
            삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}
