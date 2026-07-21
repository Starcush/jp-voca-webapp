"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { getWordFormErrorMessage } from "@/components/word-form/word-form-errors";
import type {
  WordFormField,
  WordFormState,
} from "@/components/word-form/types";
import { getPersistedNotebookId } from "@/components/notebooks/notebook-constants";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { AppSession } from "@/lib/session";
import {
  generateVocabularyReading,
  suggestVocabulary,
} from "@/lib/vocabulary-suggestions";
import { createWord, deleteWord, updateWord } from "@/lib/words";
import { storeWordSaveNotice } from "@/lib/word-save-notice";
import type { Language } from "@/types/language";
import type { NewWordInput } from "@/types/word";

type UseWordFormStateInput = {
  initialForm: WordFormState;
  isEdit: boolean;
  language: Language;
  notebookId?: string;
  session: AppSession | null;
  termLabel: string;
  wordId?: string;
};

function normalizeInput(
  form: WordFormState,
  language: Language,
  notebookId?: string,
): NewWordInput {
  const persistedNotebookId = getPersistedNotebookId(notebookId);

  return {
    language,
    term: form.term.trim(),
    ...(persistedNotebookId ? { notebookId: persistedNotebookId } : {}),
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
 * @param input.notebookId - 생성 모드에서 저장할 노트 ID입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @param input.termLabel - 필수 단어 필드의 사용자 표시 라벨입니다.
 * @param input.wordId - 수정/삭제할 단어 ID입니다.
 * @returns 폼 상태, 로딩 상태, 에러 메시지, 필드 수정/저장/삭제/읽기·뜻 찾기 액션을 반환합니다.
 */
export function useWordFormState({
  initialForm,
  isEdit,
  language,
  notebookId,
  session,
  termLabel,
  wordId,
}: UseWordFormStateInput) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WordFormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFindingVocabulary, setIsFindingVocabulary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReading, setIsGeneratingReading] = useState(false);

  async function invalidateWordData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["words"] }),
      queryClient.invalidateQueries({ queryKey: ["reviewWords"] }),
      queryClient.invalidateQueries({ queryKey: ["wordOrganizer"] }),
    ]);
  }

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

    const input = normalizeInput(form, language, notebookId);

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

      if (notebookId) {
        params.set("notebookId", notebookId);
      }

      storeWordSaveNotice({
        language,
        type: isEdit ? "updated" : "created",
      });
      await invalidateWordData();
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
      await invalidateWordData();
      router.replace(
        buildWordListHref({
          language,
          notebookId,
          path: "/words",
        }),
      );
      router.refresh();
    } catch (error) {
      console.error("Failed to delete word.", error);
      setErrorMessage(getWordFormErrorMessage(error, "delete"));
      setIsSubmitting(false);
    }
  }

  async function handleFindVocabulary() {
    const term = form.term.trim();

    if (!term) {
      setErrorMessage(`${termLabel}를 먼저 입력해주세요.`);
      return;
    }

    setErrorMessage("");
    setIsFindingVocabulary(true);

    try {
      const userReading = form.reading.trim();
      const suggestion = await suggestVocabulary({
        language,
        reading: userReading,
        sentence: form.exampleSentence.trim(),
        term,
      });
      const fallbackReading =
        userReading || suggestion.reading
          ? ""
          : await generateVocabularyReading(language, term);
      const nextReading = userReading || suggestion.reading || fallbackReading;
      const nextMeaning = form.meaning.trim() || suggestion.meaning;

      if (!nextMeaning && (language === "en" || !nextReading)) {
        setErrorMessage(
          language === "en"
            ? "뜻을 찾지 못했습니다."
            : "읽기와 뜻을 찾지 못했습니다.",
        );
        return;
      }

      setForm((currentForm) => ({
        ...currentForm,
        meaning: nextMeaning || currentForm.meaning,
        reading: nextReading || currentForm.reading,
      }));

      if (!suggestion.meaning) {
        setErrorMessage(
          language === "en"
            ? "뜻을 찾지 못했습니다. 필요한 경우 직접 입력해주세요."
            : "뜻을 찾지 못했습니다. 읽기만 채웠다면 뜻은 직접 입력해주세요.",
        );
      }
    } catch {
      setErrorMessage(
        language === "en"
          ? "뜻을 찾지 못했습니다."
          : "읽기와 뜻을 찾지 못했습니다.",
      );
    } finally {
      setIsFindingVocabulary(false);
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
      const generatedReading = await generateVocabularyReading(language, text);

      if (!generatedReading) {
        throw new Error("failed to generate reading");
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
    handleFindVocabulary,
    handleGenerateReading,
    handleSubmit,
    isFindingVocabulary,
    isGeneratingReading,
    isSubmitting,
    updateField,
  };
}
