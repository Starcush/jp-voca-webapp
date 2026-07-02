"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getPersistedNotebookId } from "@/components/notebooks/notebook-constants";
import { buildWordListHref } from "@/components/words/word-list-links";
import { useSession } from "@/lib/use-session";
import { storeWordSaveNotice } from "@/lib/word-save-notice";
import { createWord } from "@/lib/words";
import type { Language } from "@/types/language";
import type { NewWordInput } from "@/types/word";
import { MAX_STAGED_EXPRESSIONS, type StagedExpression } from "./types";

type VocabularyRequest = {
  language: Language;
  reading: string;
  sentence: string;
  term: string;
};

type VocabularySuggestion = {
  meaning: string;
  reading: string;
};

type StagedExpressionInput = Partial<
  Pick<StagedExpression, "meaning" | "reading" | "term" | "useExample">
>;

function normalizeExpressionText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function generateReading(language: Language, text: string) {
  if (language === "en") {
    return "";
  }

  const response = await fetch(language === "zh" ? "/api/pinyin" : "/api/furigana", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = (await response.json().catch(() => null)) as {
    furigana?: unknown;
    pinyin?: unknown;
    reading?: unknown;
  } | null;
  const reading = data?.reading ?? data?.furigana ?? data?.pinyin;

  if (!response.ok || typeof reading !== "string") {
    return "";
  }

  return reading;
}

async function suggestVocabulary({
  language,
  reading,
  sentence,
  term,
}: VocabularyRequest): Promise<VocabularySuggestion> {
  const response = await fetch("/api/meaning", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language,
      reading,
      sentence,
      term,
    }),
  });
  const data = (await response.json().catch(() => null)) as {
    meaning?: unknown;
    reading?: unknown;
  } | null;

  if (!response.ok || typeof data?.meaning !== "string") {
    return { meaning: "", reading: "" };
  }

  return {
    meaning: data.meaning,
    reading: typeof data.reading === "string" ? data.reading : "",
  };
}

async function trackSavedExpressions(
  language: Language,
  expressions: NewWordInput[],
) {
  await fetch("/api/meaning/track-save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entries: expressions.map((expression) => ({
        meaning: expression.meaning ?? "",
        reading: expression.reading ?? "",
        term: expression.term,
      })),
      language,
    }),
  });
}

/**
 * OCR에서 고른 표현들의 추가 예정 상태와 읽기/뜻 보강, 최종 저장 흐름을 관리합니다.
 *
 * @param language - 표현을 저장하고 읽기/뜻을 조회할 현재 언어 코드입니다.
 * @param notebookId - 저장할 노트 ID입니다.
 * @returns 추가 예정 목록, 보강/저장 로딩 상태, 표현 추가/수정/삭제/비우기/보강/저장 함수를 반환합니다.
 */
export function useStagedExpressions(language: Language, notebookId?: string) {
  const router = useRouter();
  const session = useSession();
  const [stagedExpressions, setStagedExpressions] = useState<StagedExpression[]>([]);
  const [isEnrichingExpressions, setIsEnrichingExpressions] = useState(false);
  const [isSavingWords, setIsSavingWords] = useState(false);

  function addExpression(term: string, sourceSentence: string) {
    const normalizedTerm = normalizeExpressionText(term);

    if (!normalizedTerm) {
      return "추가할 단어 또는 표현을 먼저 선택해주세요.";
    }

    if (
      stagedExpressions.some(
        (expression) =>
          expression.term.toLowerCase() === normalizedTerm.toLowerCase(),
      )
    ) {
      toast.info("이미 추가 예정 목록에 있습니다.");
      return "";
    }

    if (stagedExpressions.length >= MAX_STAGED_EXPRESSIONS) {
      toast.info(
        `한 번에 최대 ${MAX_STAGED_EXPRESSIONS}개까지 추가할 수 있습니다.`,
      );
      return "";
    }

    setStagedExpressions((currentExpressions) => [
      ...currentExpressions,
      {
        id: crypto.randomUUID(),
        meaning: "",
        reading: "",
        sourceSentence,
        term: normalizedTerm,
        useExample: true,
      },
    ]);

    return "";
  }

  async function enrichExpressions() {
    if (stagedExpressions.length === 0) {
      return "읽기와 뜻을 찾을 표현을 먼저 추가해주세요.";
    }

    if (!stagedExpressions.some((expression) => expression.term.trim())) {
      return "읽기와 뜻을 찾을 단어 또는 표현을 입력해주세요.";
    }

    setIsEnrichingExpressions(true);

    try {
      const enrichedExpressions = await Promise.all(
        stagedExpressions.map(async (expression) => {
          const term = expression.term.trim();

          if (!term) {
            return expression;
          }

          const userReading = expression.reading.trim();
          const currentMeaning = expression.meaning.trim();
          const suggestion = await suggestVocabulary({
            language,
            reading: userReading,
            sentence: expression.sourceSentence,
            term,
          });
          const fallbackReading =
            userReading || suggestion.reading
              ? ""
              : await generateReading(language, term);
          const reading =
            userReading || suggestion.reading || fallbackReading;
          const meaning = currentMeaning || suggestion.meaning;

          return {
            ...expression,
            meaning,
            reading,
          };
        }),
      );

      setStagedExpressions(enrichedExpressions);
      return "";
    } catch (error) {
      console.error("Failed to enrich staged expressions.", error);
      return "읽기와 뜻을 찾지 못했습니다.";
    } finally {
      setIsEnrichingExpressions(false);
    }
  }

  function updateExpression(expressionId: string, input: StagedExpressionInput) {
    setStagedExpressions((currentExpressions) =>
      currentExpressions.map((expression) =>
        expression.id === expressionId
          ? {
              ...expression,
              ...input,
            }
          : expression,
      ),
    );
  }

  function removeExpression(expressionId: string) {
    setStagedExpressions((currentExpressions) =>
      currentExpressions.filter((expression) => expression.id !== expressionId),
    );
  }

  function clearExpressions() {
    setStagedExpressions([]);
  }

  async function saveExpressions() {
    if (!session) {
      return "로그인이 필요합니다.";
    }

    if (stagedExpressions.some((expression) => !expression.term.trim())) {
      return "비어 있는 단어 또는 표현을 채워주세요.";
    }

    const persistedNotebookId = getPersistedNotebookId(notebookId);
    const inputs: NewWordInput[] = stagedExpressions
      .map((expression) => ({
        language,
        term: expression.term.trim(),
        ...(persistedNotebookId ? { notebookId: persistedNotebookId } : {}),
        reading: expression.reading.trim() || undefined,
        meaning: expression.meaning.trim() || undefined,
        exampleSentence: expression.useExample
          ? expression.sourceSentence.trim() || undefined
          : undefined,
      }))
      .filter((input) => input.term);

    if (inputs.length === 0) {
      return "저장할 표현을 먼저 추가해주세요.";
    }

    setIsSavingWords(true);

    try {
      await Promise.all(inputs.map((input) => createWord(session.uid, input)));
      await trackSavedExpressions(language, inputs).catch((error) => {
        console.error("Failed to track OCR saved expressions.", error);
      });
      storeWordSaveNotice({
        language,
        type: "created",
      });
      router.replace(
        buildWordListHref({
          language,
          notebookId,
          path: "/words",
        }),
      );
      router.refresh();
      return "";
    } catch (error) {
      console.error("Failed to save staged OCR words.", error);
      return "추가 예정 목록을 저장하지 못했습니다.";
    } finally {
      setIsSavingWords(false);
    }
  }

  return {
    addExpression,
    clearExpressions,
    enrichExpressions,
    isEnrichingExpressions,
    isSavingWords,
    removeExpression,
    saveExpressions,
    stagedExpressions,
    updateExpression,
  };
}
