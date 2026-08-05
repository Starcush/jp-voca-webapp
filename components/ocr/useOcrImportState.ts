"use client";

import { useReducer } from "react";
import type { OcrImportStep } from "@/components/ocr/ocr-import-steps";

type OcrImportState = {
  activeStep: OcrImportStep;
  editableSentences: string[];
  errorMessage: string;
  extractedText: string;
  selectedNotebookId?: string;
};

type OcrImportAction =
  | { type: "clear_error" }
  | { message: string; type: "set_error" }
  | { notebookId?: string; type: "set_notebook" }
  | { sentences: string[]; type: "prepare_sentences" }
  | { step: OcrImportStep; type: "set_step" }
  | { index: number; sentence: string; type: "update_sentence" }
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
    prepareSentences: (sentences: string[]) =>
      dispatch({ sentences, type: "prepare_sentences" }),
    resetForImage: () => dispatch({ type: "reset_for_image" }),
    setActiveStep: (step: OcrImportStep) =>
      dispatch({ step, type: "set_step" }),
    setErrorMessage: (message: string) =>
      dispatch({ message, type: "set_error" }),
    setExtractedText: (text: string) =>
      dispatch({ text, type: "set_extracted_text" }),
    setSelectedNotebookId: (notebookId?: string) =>
      dispatch({ notebookId, type: "set_notebook" }),
    updateSentence: (index: number, sentence: string) =>
      dispatch({ index, sentence, type: "update_sentence" }),
  };
}
