import type { Language } from "@/types/language";

const sentenceEndMarks = new Set(["。", "！", "？", "!", "?", ".", "．", "…"]);
const closingMarks = new Set([
  "\"",
  "'",
  ")",
  "]",
  "}",
  "）",
  "］",
  "｝",
  "」",
  "』",
  "】",
  "》",
  "〉",
  "”",
  "’",
]);

function isSentenceEnd(characters: string[], index: number) {
  const character = characters[index];

  if (!sentenceEndMarks.has(character)) {
    return false;
  }

  if ((character === "." || character === "．") && index > 0) {
    const previousCharacter = characters[index - 1];
    const nextCharacter = characters[index + 1];

    if (/\d/.test(previousCharacter) && nextCharacter && /\d/.test(nextCharacter)) {
      return false;
    }
  }

  return true;
}

function normalizeSentence(sentence: string) {
  return sentence.replace(/\s+/g, " ").trim();
}

function pushSentence(sentences: string[], sentence: string) {
  const normalizedSentence = normalizeSentence(sentence);

  if (normalizedSentence) {
    sentences.push(normalizedSentence);
  }
}

/**
 * OCR로 추출한 원문 텍스트를 학습하기 좋은 문장 단위로 나눕니다.
 *
 * @param text - OCR로 추출했거나 사용자가 직접 수정한 원문 텍스트입니다.
 * @param language - 줄바꿈 결합 방식을 결정할 현재 언어 코드입니다.
 * @returns 문장부호와 닫는 따옴표/괄호 기준으로 분리된 문장 배열을 반환합니다.
 */
export function splitTextIntoSentences(text: string, language: Language) {
  const sentences: string[] = [];
  const lineJoiner = language === "en" ? " " : "";
  const normalizedText = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(lineJoiner);
  const characters = Array.from(normalizedText);
  let buffer = "";

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];

    buffer += character;

    if (!isSentenceEnd(characters, index)) {
      continue;
    }

    while (closingMarks.has(characters[index + 1])) {
      index += 1;
      buffer += characters[index];
    }

    pushSentence(sentences, buffer);
    buffer = "";
  }

  pushSentence(sentences, buffer);

  return sentences;
}
