"use client";

import { useReducer } from "react";
import type { OcrImportStep } from "@/components/ocr/ocr-import-steps";
import type { OcrReadingDirection } from "@/types/ocr";

type OcrImportState = {
  activeStep: OcrImportStep;
  editableSentences: string[];
  errorMessage: string;
  extractedText: string;
  readingDirection: OcrReadingDirection;
  selectedNotebookId?: string;
};

type OcrImportAction =
  | { type: "clear_error" }
  | { message: string; type: "set_error" }
  | { notebookId?: string; type: "set_notebook" }
  | { readingDirection: OcrReadingDirection; type: "set_reading_direction" }
  | { sentences: string[]; type: "prepare_sentences" }
  | { step: OcrImportStep; type: "set_step" }
  | { index: number; sentence: string; type: "update_sentence" }
  | { index: number; type: "remove_sentence" }
  | { index: number; separator: string; type: "merge_sentence_with_previous" }
  | { index: number; type: "split_sentence_by_lines" }
  | { text: string; type: "set_extracted_text" }
  | { sentences: string[]; text: string; type: "complete_extraction" }
  | { type: "reset_for_image" };

function createInitialOcrImportState(
  selectedNotebookId?: string,
): OcrImportState {
  return {
    activeStep: "extract",
    editableSentences: [],
    errorMessage: "",
    extractedText: "",
    readingDirection: "auto",
    selectedNotebookId,
  };
}

function ocrImportReducer(
  state: OcrImportState,
  action: OcrImportAction,
): OcrImportState {
  switch (action.type) {
    case "clear_error":
      return {
        ...state,
        errorMessage: "",
      };
    case "set_error":
      return {
        ...state,
        errorMessage: action.message,
      };
    case "set_notebook":
      return {
        ...state,
        selectedNotebookId: action.notebookId,
      };
    case "set_reading_direction":
      return {
        ...state,
        readingDirection: action.readingDirection,
      };
    case "prepare_sentences":
      return {
        ...state,
        activeStep: "select",
        editableSentences: action.sentences,
        errorMessage: "",
      };
    case "set_step":
      return {
        ...state,
        activeStep: action.step,
        errorMessage: "",
      };
    case "update_sentence":
      return {
        ...state,
        editableSentences: state.editableSentences.map((sentence, index) =>
          index === action.index ? action.sentence : sentence,
        ),
      };
    case "remove_sentence":
      return {
        ...state,
        editableSentences: state.editableSentences.filter(
          (_, index) => index !== action.index,
        ),
      };
    case "merge_sentence_with_previous":
      if (action.index <= 0 || action.index >= state.editableSentences.length) {
        return state;
      }

      return {
        ...state,
        editableSentences: state.editableSentences.reduce<string[]>(
          (sentences, sentence, index) => {
            if (index === action.index - 1) {
              sentences.push(
                `${sentence.trim()}${action.separator}${state.editableSentences[
                  action.index
                ].trim()}`.trim(),
              );
              return sentences;
            }

            if (index === action.index) {
              return sentences;
            }

            sentences.push(sentence);
            return sentences;
          },
          [],
        ),
      };
    case "split_sentence_by_lines":
      return {
        ...state,
        editableSentences: state.editableSentences.flatMap((sentence, index) => {
          if (index !== action.index) {
            return sentence;
          }

          const splitSentences = sentence
            .split(/\n+/)
            .map((part) => part.trim())
            .filter(Boolean);

          return splitSentences.length > 0 ? splitSentences : sentence;
        }),
      };
    case "set_extracted_text":
      return {
        ...state,
        extractedText: action.text,
      };
    case "complete_extraction":
      return {
        ...state,
        activeStep: "extract",
        editableSentences: action.sentences,
        errorMessage: "",
        extractedText: action.text,
      };
    case "reset_for_image":
      return {
        ...state,
        activeStep: "extract",
        editableSentences: [],
        errorMessage: "",
        extractedText: "",
      };
  }
}

/**
 * OCR 가져오기 화면 안에서만 쓰는 단계, 텍스트, 에러, 읽기 방향, 저장 노트 상태를 reducer로 관리합니다.
 *
 * @param initialSelectedNotebookId - URL에서 들어온 초기 저장 노트 ID입니다.
 * @returns OCR 가져오기 UI 상태와 상태 전이 함수들을 반환합니다.
 */
export function useOcrImportState(initialSelectedNotebookId?: string) {
  const [state, dispatch] = useReducer(
    ocrImportReducer,
    initialSelectedNotebookId,
    createInitialOcrImportState,
  );

  return {
    ...state,
    clearErrorMessage: () => dispatch({ type: "clear_error" }),
    completeExtraction: (text: string, sentences: string[]) =>
      dispatch({ sentences, text, type: "complete_extraction" }),
    mergeSentenceWithPrevious: (index: number, separator: string) =>
      dispatch({ index, separator, type: "merge_sentence_with_previous" }),
    prepareSentences: (sentences: string[]) =>
      dispatch({ sentences, type: "prepare_sentences" }),
    removeSentence: (index: number) =>
      dispatch({ index, type: "remove_sentence" }),
    resetForImage: () => dispatch({ type: "reset_for_image" }),
    setActiveStep: (step: OcrImportStep) =>
      dispatch({ step, type: "set_step" }),
    setErrorMessage: (message: string) =>
      dispatch({ message, type: "set_error" }),
    setExtractedText: (text: string) =>
      dispatch({ text, type: "set_extracted_text" }),
    setReadingDirection: (readingDirection: OcrReadingDirection) =>
      dispatch({ readingDirection, type: "set_reading_direction" }),
    setSelectedNotebookId: (notebookId?: string) =>
      dispatch({ notebookId, type: "set_notebook" }),
    splitSentenceByLines: (index: number) =>
      dispatch({ index, type: "split_sentence_by_lines" }),
    updateSentence: (index: number, sentence: string) =>
      dispatch({ index, sentence, type: "update_sentence" }),
  };
}
