"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getPersistedNotebookId } from "@/components/notebooks/notebook-constants";
import { buildWordListHref } from "@/components/words/word-list-links";
import { useSession } from "@/lib/use-session";
import {
  generateVocabularyReading,
  suggestVocabulary,
} from "@/lib/vocabulary-suggestions";
import { storeWordSaveNotice } from "@/lib/word-save-notice";
import { createWord } from "@/lib/words";
import type { Language } from "@/types/language";
import type { NewWordInput } from "@/types/word";
import {
  ENRICHMENT_BATCH_SIZE,
  MAX_STAGED_EXPRESSIONS,
  type EnrichmentProgress,
  type StagedExpression,
} from "./types";

type EnrichedExpressionResult = {
  expression: StagedExpression;
  failed: boolean;
};

type StagedExpressionInput = Partial<
  Pick<StagedExpression, "meaning" | "reading" | "term" | "useExample">
>;

function chunkExpressions(
  expressions: StagedExpression[],
  batchSize: number,
) {
  const chunks: StagedExpression[][] = [];

  for (let index = 0; index < expressions.length; index += batchSize) {
    chunks.push(expressions.slice(index, index + batchSize));
  }

  return chunks;
}

function normalizeExpressionText(text: string) {
  return text.replace(/\s+/g, " ").trim();
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

async function enrichExpression(
  language: Language,
  expression: StagedExpression,
): Promise<EnrichedExpressionResult> {
  const term = expression.term.trim();

  if (!term) {
    return { expression, failed: false };
  }

  try {
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
        : await generateVocabularyReading(language, term);
    const reading = userReading || suggestion.reading || fallbackReading;
    const meaning = currentMeaning || suggestion.meaning;
    const failed =
      suggestion.failed ||
      (!currentMeaning && !suggestion.meaning.trim()) ||
      (language !== "en" && !userReading && !reading.trim());

    return {
      expression: {
        ...expression,
        enrichmentFailed: failed,
        meaning,
        reading,
      },
      failed,
    };
  } catch (error) {
    console.error("Failed to enrich staged expression.", error);
    return {
      expression: {
        ...expression,
        enrichmentFailed: true,
      },
      failed: true,
    };
  }
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
  const [enrichmentProgress, setEnrichmentProgress] =
    useState<EnrichmentProgress | null>(null);
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
        enrichmentFailed: false,
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

    const targetExpressions = stagedExpressions.filter((expression) =>
      expression.term.trim(),
    );
    const totalExpressionCount = targetExpressions.length;

    setIsEnrichingExpressions(true);
    setEnrichmentProgress({
      completed: 0,
      total: totalExpressionCount,
    });

    try {
      const enrichedExpressionsById = new Map<string, StagedExpression>();
      let completedExpressionCount = 0;
      let failedExpressionCount = 0;

      for (const batch of chunkExpressions(
        targetExpressions,
        ENRICHMENT_BATCH_SIZE,
      )) {
        const batchResults = await Promise.all(
          batch.map((expression) => enrichExpression(language, expression)),
        );

        batchResults.forEach((result) => {
          enrichedExpressionsById.set(result.expression.id, result.expression);

          if (result.failed) {
            failedExpressionCount += 1;
          }
        });
        completedExpressionCount += batchResults.length;

        setStagedExpressions((currentExpressions) =>
          currentExpressions.map(
            (expression) =>
              enrichedExpressionsById.get(expression.id) ?? expression,
          ),
        );
        setEnrichmentProgress({
          completed: completedExpressionCount,
          total: totalExpressionCount,
        });
      }

      if (failedExpressionCount > 0) {
        return `일부 표현 ${failedExpressionCount}개의 읽기와 뜻을 찾지 못했습니다.`;
      }

      return "";
    } finally {
      setIsEnrichingExpressions(false);
      setEnrichmentProgress(null);
    }
  }

  function updateExpression(expressionId: string, input: StagedExpressionInput) {
    setStagedExpressions((currentExpressions) =>
      currentExpressions.map((expression) =>
        expression.id === expressionId
          ? {
              ...expression,
              enrichmentFailed: false,
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
    setEnrichmentProgress(null);
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
    enrichmentProgress,
    enrichExpressions,
    isEnrichingExpressions,
    isSavingWords,
    removeExpression,
    saveExpressions,
    stagedExpressions,
    updateExpression,
  };
}
