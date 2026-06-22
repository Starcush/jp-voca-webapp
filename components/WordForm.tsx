"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getLanguageOption } from "@/lib/languages";
import {
  createWord,
  deleteWord,
  getWord,
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

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

function getWordFormErrorMessage(
  error: unknown,
  action: "load" | "save" | "delete",
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

export function WordForm({ language, mode, wordId }: WordFormProps) {
  const router = useRouter();
  const session = useSession();
  const isEdit = mode === "edit";
  const languageOption = getLanguageOption(language);
  const canAutoGenerateReading = language === "ja" || language === "zh";
  const [form, setForm] = useState<WordFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReading, setIsGeneratingReading] = useState(false);

  const loadWord = useCallback(async () => {
    if (!isEdit || !wordId || !session) {
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const word = await getWord(wordId);

      if (!word || word.uid !== session.uid) {
        setErrorMessage("단어를 찾을 수 없습니다.");
        return;
      }

      setForm(toFormState(word));
    } catch (error) {
      console.error("Failed to load word.", error);
      setErrorMessage(getWordFormErrorMessage(error, "load"));
    } finally {
      setIsLoading(false);
    }
  }, [isEdit, session, wordId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWord();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWord]);

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

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">단어를 불러오는 중</p>
      </section>
    );
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

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
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
