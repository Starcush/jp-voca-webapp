"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createWord, deleteWord, getWord, updateWord } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { NewWordInput, Word } from "@/types/word";

type WordFormProps = {
  mode: "create" | "edit";
  wordId?: string;
};

type WordFormState = {
  kanji: string;
  yomikataFurigana: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
};

const emptyForm: WordFormState = {
  kanji: "",
  yomikataFurigana: "",
  meaning: "",
  exampleSentence: "",
  exampleTranslation: "",
};

function toFormState(word: Word): WordFormState {
  return {
    kanji: word.kanji,
    yomikataFurigana: word.yomikataFurigana ?? "",
    meaning: word.meaning ?? "",
    exampleSentence: word.exampleSentence ?? "",
    exampleTranslation: word.exampleTranslation ?? "",
  };
}

function normalizeInput(form: WordFormState): NewWordInput {
  return {
    kanji: form.kanji.trim(),
    yomikataFurigana: form.yomikataFurigana.trim() || undefined,
    meaning: form.meaning.trim() || undefined,
    exampleSentence: form.exampleSentence.trim() || undefined,
    exampleTranslation: form.exampleTranslation?.trim() || undefined,
  };
}

export function WordForm({ mode, wordId }: WordFormProps) {
  const router = useRouter();
  const session = useSession();
  const isEdit = mode === "edit";
  const [form, setForm] = useState<WordFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch {
      setErrorMessage("단어를 불러오지 못했습니다.");
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

    const input = normalizeInput(form);

    if (!input.kanji) {
      setErrorMessage("한자 / 단어를 입력해주세요.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isEdit && wordId) {
        await updateWord(wordId, input);
      } else {
        await createWord(session.uid, input);
      }

      router.replace("/words");
      router.refresh();
    } catch {
      setErrorMessage("단어를 저장하지 못했습니다.");
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
      router.replace("/words");
      router.refresh();
    } catch {
      setErrorMessage("단어를 삭제하지 못했습니다.");
      setIsSubmitting(false);
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
          한자 / 단어
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-600">
            필수
          </span>
        </span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => setForm({ ...form, kanji: event.target.value })}
          placeholder="食べる"
          required
          value={form.kanji}
        />
      </label>

      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          후리가나
          <span className="text-xs font-semibold text-slate-400">선택</span>
        </span>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
            onChange={(event) =>
              setForm({ ...form, yomikataFurigana: event.target.value })
            }
            placeholder="たべる"
            value={form.yomikataFurigana}
          />
          <button
            className="min-h-12 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled
            type="button"
          >
            자동 생성
          </button>
        </div>
      </label>

      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          뜻
          <span className="text-xs font-semibold text-slate-400">선택</span>
        </span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => setForm({ ...form, meaning: event.target.value })}
          placeholder="먹다"
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
          placeholder="朝ごはんを食べる。"
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
