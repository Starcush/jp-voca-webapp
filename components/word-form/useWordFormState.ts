"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getWordFormErrorMessage } from "@/components/word-form/word-form-errors";
import type {
  WordFormField,
  WordFormState,
} from "@/components/word-form/types";
import type { AppSession } from "@/lib/session";
import { createWord, deleteWord, updateWord } from "@/lib/words";
import { storeWordSaveNotice } from "@/lib/word-save-notice";
import type { Language } from "@/types/language";
import type { NewWordInput } from "@/types/word";

type UseWordFormStateInput = {
  initialForm: WordFormState;
  isEdit: boolean;
  language: Language;
  session: AppSession | null;
  termLabel: string;
  wordId?: string;
};

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

/**
 * 단어 생성/수정 폼의 입력 상태와 저장, 삭제, 읽기 자동 생성 액션을 관리합니다.
 *
 * @param input - 단어 폼 상태와 액션에 필요한 값입니다.
 * @param input.initialForm - 폼이 처음 렌더링될 때 사용할 입력값입니다.
 * @param input.isEdit - 현재 폼이 수정 모드인지 여부입니다.
 * @param input.language - 저장할 단어의 언어입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @param input.termLabel - 필수 단어 필드의 사용자 표시 라벨입니다.
 * @param input.wordId - 수정/삭제할 단어 ID입니다.
 * @returns 폼 상태, 로딩 상태, 에러 메시지, 필드 수정/저장/삭제/읽기 생성 액션을 반환합니다.
 */
export function useWordFormState({
  initialForm,
  isEdit,
  language,
  session,
  termLabel,
  wordId,
}: UseWordFormStateInput) {
  const router = useRouter();
  const [form, setForm] = useState<WordFormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReading, setIsGeneratingReading] = useState(false);

  function updateField(field: WordFormField, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    const input = normalizeInput(form, language);

    if (!input.term) {
      setErrorMessage(`${termLabel}를 입력해주세요.`);
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
      setErrorMessage(`${termLabel}를 먼저 입력해주세요.`);
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

      updateField("reading", generatedReading);
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

  return {
    errorMessage,
    form,
    handleDelete,
    handleGenerateReading,
    handleSubmit,
    isGeneratingReading,
    isSubmitting,
    updateField,
  };
}
