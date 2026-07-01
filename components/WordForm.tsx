"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getWordFormErrorMessage } from "@/components/word-form/word-form-errors";
import { useWordFormQuery } from "@/components/word-form/useWordFormQuery";
import { getLanguageOption } from "@/lib/languages";
import type { AppSession } from "@/lib/session";
import {
  createWord,
  deleteWord,
  getWordReading,
  getWordTerm,
  updateWord,
} from "@/lib/words";
import { storeWordSaveNotice } from "@/lib/word-save-notice";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { NewWordInput, Word } from "@/types/word";

type WordFormProps = {
  language: Language;
  mode: "create" | "edit";
  wordId?: string;
};

type WordFormBodyProps = WordFormProps & {
  initialForm: WordFormState;
  loadErrorMessage: string;
  session: AppSession | null;
};

type WordFormState = {
  term: string;
  reading: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
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

function normalizeInput(form: WordFormState, language: Language): NewWordInput {
  return {
    language,
    term: form.term.trim(),
    reading: form.reading.trim() || undefined,
    meaning: form.meaning.trim() || undefined,
    exampleSentence: form.exampleSentence.trim() || undefined,
    exampleTranslation: form.exampleTranslation?.trim() || undefined,
  };
}

function getTermPlaceholder(language: Language) {
  if (language === "en") {
    return "apple";
  }

  if (language === "zh") {
    return "你好";
  }

  return "食べる";
}

function getReadingPlaceholder(language: Language) {
  if (language === "zh") {
    return "ni hao";
  }

  return "たべる";
}

function getMeaningPlaceholder(language: Language) {
  if (language === "en") {
    return "사과";
  }

  if (language === "zh") {
    return "안녕하세요";
  }

  return "먹다";
}

function getExamplePlaceholder(language: Language) {
  if (language === "en") {
    return "I eat an apple.";
  }

  if (language === "zh") {
    return "你好，今天见到你很高兴。";
  }

  return "朝ごはんを食べる。";
}

/**
 * 단어 생성/수정 입력 폼을 렌더링합니다.
 *
 * @param props - 단어 폼에 필요한 모드와 언어 정보입니다.
 * @param props.language - 저장할 단어의 언어입니다.
 * @param props.mode - 생성 또는 수정 모드입니다.
 * @param props.wordId - 수정 모드에서 불러올 단어 ID입니다.
 * @returns 단어 입력 필드, 자동 읽기 생성, 저장/삭제 액션을 렌더링합니다.
 */
export function WordForm({ language, mode, wordId }: WordFormProps) {
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
  session,
  wordId,
}: WordFormBodyProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const languageOption = getLanguageOption(language);
  const canAutoGenerateReading = language === "ja" || language === "zh";
  const [form, setForm] = useState<WordFormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReading, setIsGeneratingReading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    const input = normalizeInput(form, language);

    if (!input.term) {
      setErrorMessage(`${languageOption.termLabel}를 입력해주세요.`);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      let savedWordId = wordId;

      if (isEdit && wordId) {
        await updateWord(wordId, input);
      } else {
        savedWordId = await createWord(session.uid, input);
      }

      const params = new URLSearchParams({ lang: language });

      if (savedWordId) {
        params.set("wordId", savedWordId);
      }

      storeWordSaveNotice({
        language,
        type: isEdit ? "updated" : "created",
      });
      router.replace(`/words?${params.toString()}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to save word.", error);
      setErrorMessage(getWordFormErrorMessage(error, "save"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!wordId || !confirm("이 단어를 삭제할까요?")) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await deleteWord(wordId);
      storeWordSaveNotice({ language, type: "deleted" });
      router.replace(`/words?lang=${language}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete word.", error);
      setErrorMessage(getWordFormErrorMessage(error, "delete"));
      setIsSubmitting(false);
    }
  }

  async function handleGenerateReading() {
    const text = form.term.trim();

    if (!text) {
      setErrorMessage(`${languageOption.termLabel}를 먼저 입력해주세요.`);
      return;
    }

    setErrorMessage("");
    setIsGeneratingReading(true);

    try {
      const response = await fetch(language === "zh" ? "/api/pinyin" : "/api/furigana", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as {
        furigana?: string;
        pinyin?: string;
        reading?: string;
        error?: string;
      };
      const generatedReading = data.reading ?? data.furigana ?? data.pinyin;

      if (!response.ok || !generatedReading) {
        throw new Error(data.error ?? "failed to generate reading");
      }

      setForm((currentForm) => ({
        ...currentForm,
        reading: generatedReading,
      }));
    } catch {
      setErrorMessage(
        language === "zh"
          ? "병음을 자동 생성하지 못했습니다."
          : "후리가나를 자동 생성하지 못했습니다.",
      );
    } finally {
      setIsGeneratingReading(false);
    }
  }

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
          onChange={(event) => setForm({ ...form, term: event.target.value })}
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
              onChange={(event) => setForm({ ...form, reading: event.target.value })}
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
          onChange={(event) => setForm({ ...form, meaning: event.target.value })}
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
          onChange={(event) => setForm({ ...form, exampleSentence: event.target.value })}
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
            setForm({ ...form, exampleTranslation: event.target.value })
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
