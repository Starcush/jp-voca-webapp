"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { getLanguageOption } from "@/lib/languages";
import { useSession } from "@/lib/use-session";
import { createWord } from "@/lib/words";
import { storeWordSaveNotice } from "@/lib/word-save-notice";
import type { Language } from "@/types/language";
import type { NewWordInput } from "@/types/word";

type OcrImportFormProps = {
  language: Language;
};

const OCR_IMAGE_MAX_SIZE = 1800;
const OCR_IMAGE_QUALITY = 0.86;
const MAX_STAGED_EXPRESSIONS = 10;

type StagedExpression = {
  exampleSentence?: string;
  id: string;
  meaning: string;
  reading: string;
  sourceSentence: string;
  term: string;
  useExample: boolean;
};

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

function splitTextIntoSentences(text: string, language: Language) {
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

function normalizeSelectedText(text: string) {
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

async function suggestMeaning({
  language,
  reading,
  sentence,
  term,
}: {
  language: Language;
  reading: string;
  sentence: string;
  term: string;
}) {
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
  } | null;

  if (!response.ok || typeof data?.meaning !== "string") {
    return "";
  }

  return data.meaning;
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

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽지 못했습니다."));
    };
    image.src = url;
  });
}

async function prepareImageForOcr(file: File) {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    OCR_IMAGE_MAX_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("사진을 처리하지 못했습니다.");
  }

  context.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("사진을 처리하지 못했습니다."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      OCR_IMAGE_QUALITY,
    );
  });
}

export function OcrImportForm({ language }: OcrImportFormProps) {
  const router = useRouter();
  const session = useSession();
  const languageOption = getLanguageOption(language);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [stagedExpressions, setStagedExpressions] = useState<StagedExpression[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEnrichingExpressions, setIsEnrichingExpressions] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSavingWords, setIsSavingWords] = useState(false);
  const sentenceRef = useRef<HTMLDivElement>(null);
  const sentences = useMemo(
    () => splitTextIntoSentences(extractedText, language),
    [extractedText, language],
  );
  const lastSentenceIndex = Math.max(sentences.length - 1, 0);
  const activeSentenceIndex = Math.min(currentSentenceIndex, lastSentenceIndex);
  const currentSentence = sentences[activeSentenceIndex] ?? "";
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateSelection() {
    const selection = window.getSelection();
    const container = sentenceRef.current;

    if (!selection || selection.isCollapsed || !container) {
      setSelectedText("");
      return;
    }

    if (
      !selection.anchorNode ||
      !selection.focusNode ||
      !container.contains(selection.anchorNode) ||
      !container.contains(selection.focusNode)
    ) {
      setSelectedText("");
      return;
    }

    setSelectedText(normalizeSelectedText(selection.toString()));
  }

  function addExpression(term: string, sourceSentence: string) {
    const normalizedTerm = normalizeSelectedText(term);

    if (!normalizedTerm) {
      setErrorMessage("추가할 단어 또는 표현을 먼저 선택해주세요.");
      return;
    }

    if (
      stagedExpressions.some(
        (expression) => expression.term.toLowerCase() === normalizedTerm.toLowerCase(),
      )
    ) {
      toast.info("이미 추가 예정 목록에 있습니다.");
      return;
    }

    if (stagedExpressions.length >= MAX_STAGED_EXPRESSIONS) {
      toast.info(
        `한 번에 최대 ${MAX_STAGED_EXPRESSIONS}개까지 추가할 수 있습니다.`,
      );
      return;
    }

    setErrorMessage("");
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
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }

  async function enrichStagedExpressions() {
    if (stagedExpressions.length === 0) {
      setErrorMessage("읽기와 뜻을 찾을 표현을 먼저 추가해주세요.");
      return;
    }

    setErrorMessage("");
    setIsEnrichingExpressions(true);

    try {
      const enrichedExpressions = await Promise.all(
        stagedExpressions.map(async (expression) => {
          const term = expression.term.trim();

          if (!term) {
            return expression;
          }

          const reading =
            expression.reading.trim() || (await generateReading(language, term));
          const meaning =
            expression.meaning.trim() ||
            (await suggestMeaning({
              language,
              reading,
              sentence: expression.sourceSentence,
              term,
            }));

          return {
            ...expression,
            meaning,
            reading,
          };
        }),
      );

      setStagedExpressions(enrichedExpressions);
    } catch (error) {
      console.error("Failed to enrich staged expressions.", error);
      setErrorMessage("읽기와 뜻을 찾지 못했습니다.");
    } finally {
      setIsEnrichingExpressions(false);
    }
  }

  function updateStagedExpression(
    expressionId: string,
    input: Partial<Pick<StagedExpression, "meaning" | "reading" | "term" | "useExample">>,
  ) {
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

  function handleImageFileChange(file?: File) {
    setImageFile(file ?? null);
    setExtractedText("");
    setSelectedText("");
    setStagedExpressions([]);
    setErrorMessage("");
  }

  async function saveStagedExpressions() {
    if (!session) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    const inputs: NewWordInput[] = stagedExpressions
      .map((expression) => ({
        language,
        term: expression.term.trim(),
        reading: expression.reading.trim() || undefined,
        meaning: expression.meaning.trim() || undefined,
        exampleSentence: expression.useExample
          ? expression.sourceSentence.trim() || undefined
          : undefined,
      }))
      .filter((input) => input.term);

    if (inputs.length === 0) {
      setErrorMessage("저장할 표현을 먼저 추가해주세요.");
      return;
    }

    setErrorMessage("");
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
      router.replace(`/words?lang=${language}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to save staged OCR words.", error);
      setErrorMessage("추가 예정 목록을 저장하지 못했습니다.");
    } finally {
      setIsSavingWords(false);
    }
  }

  async function handleExtractText() {
    if (!imageFile) {
      setErrorMessage("사진을 먼저 선택해주세요.");
      return;
    }

    setErrorMessage("");
    setIsExtracting(true);

    try {
      const preparedImage = await prepareImageForOcr(imageFile);
      const formData = new FormData();
      formData.append("image", preparedImage, "ocr-image.jpg");
      formData.append("language", language);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        text?: unknown;
        error?: unknown;
      } | null;

      if (!response.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "텍스트를 추출하지 못했습니다.",
        );
      }

      const text = typeof body?.text === "string" ? body.text : "";
      setExtractedText(text);
      setCurrentSentenceIndex(0);
      setSelectedText("");
      setStagedExpressions([]);

      if (!text) {
        setErrorMessage("인식된 텍스트가 없습니다. 더 선명한 사진으로 다시 시도해주세요.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "텍스트를 추출하지 못했습니다.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <>
      <LoadingOverlay
        message={
          isSavingWords
            ? "단어장에 저장하는 중"
            : isEnrichingExpressions
              ? "읽기와 뜻을 찾는 중"
              : "사진에서 텍스트를 읽는 중"
        }
        show={isExtracting || isEnrichingExpressions || isSavingWords}
      />
      <section className="grid gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-base font-bold text-slate-950">
            {languageOption.label} 책 사진 올리기
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            사진에서 텍스트를 추출한 뒤, 문장별로 모르는 단어와 문법 표현을 선택해 단어장에 추가할 수 있습니다.
          </p>
          <div className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">사진</span>
            <label className="grid min-h-11 cursor-pointer place-items-center rounded-lg bg-slate-950 px-3 text-sm font-bold text-white">
              사진 선택
              <input
                accept="image/*"
                className="sr-only"
                onChange={(event) =>
                  handleImageFileChange(event.target.files?.[0])
                }
                type="file"
              />
            </label>
            {imageFile ? (
              <p className="text-xs font-semibold text-slate-500">
                선택됨: {imageFile.name}
              </p>
            ) : null}
          </div>
          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews are not served through Next image optimization. */}
              <img
                alt="OCR 미리보기"
                className="max-h-80 w-full object-contain"
                src={previewUrl}
              />
            </div>
          ) : null}
          {errorMessage ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <button
            className="mt-4 min-h-12 w-full rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!imageFile || isExtracting}
            onClick={() => void handleExtractText()}
            type="button"
          >
            텍스트 추출
          </button>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-700">추출된 텍스트</span>
          <textarea
            className="min-h-64 rounded-lg border-slate-200 bg-white text-base leading-7"
            onChange={(event) => {
              setExtractedText(event.target.value);
              setCurrentSentenceIndex(0);
              setSelectedText("");
            }}
            placeholder="사진에서 인식된 텍스트가 여기에 표시됩니다."
            value={extractedText}
          />
        </label>

        {sentences.length > 0 ? (
          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold text-slate-950">문장별 선택</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  문장에서 단어, 문법, 짧은 구절을 드래그하거나 길게 눌러 선택하세요.
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-slate-500">
                {activeSentenceIndex + 1} / {sentences.length}
              </p>
            </div>

            <div
              className="select-text rounded-lg border border-slate-200 bg-slate-50 p-4 text-lg font-semibold leading-8 text-slate-950"
              onKeyUp={updateSelection}
              onMouseUp={updateSelection}
              onTouchEnd={() => window.setTimeout(updateSelection, 0)}
              ref={sentenceRef}
              tabIndex={0}
            >
              {currentSentence}
            </div>

            {selectedText ? (
              <button
                className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => addExpression(selectedText, currentSentence)}
                type="button"
              >
                선택한 표현 추가: {selectedText}
              </button>
            ) : (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                선택한 텍스트가 여기에 표시됩니다.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={activeSentenceIndex === 0}
                onClick={() => {
                  setCurrentSentenceIndex((index) => Math.max(index - 1, 0));
                  setSelectedText("");
                }}
                type="button"
              >
                이전 문장
              </button>
              <button
                className="min-h-11 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={activeSentenceIndex >= sentences.length - 1}
                onClick={() => {
                  setCurrentSentenceIndex((index) =>
                    Math.min(index + 1, sentences.length - 1),
                  );
                  setSelectedText("");
                }}
                type="button"
              >
                다음 문장
              </button>
            </div>
          </section>
        ) : null}

        {stagedExpressions.length > 0 ? (
          <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold text-slate-950">
                  추가 예정 {stagedExpressions.length} / {MAX_STAGED_EXPRESSIONS}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  문장을 이동해도 유지됩니다. 사진을 다시 선택하거나 텍스트를 다시 추출하면 초기화됩니다.
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  먼저 표현을 담아둔 뒤, 읽기와 뜻을 한 번에 찾을 수 있습니다.
                </p>
              </div>
              <div className="grid shrink-0 gap-2">
                <button
                  className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isEnrichingExpressions}
                  onClick={() => void enrichStagedExpressions()}
                  type="button"
                >
                  읽기와 뜻 찾기
                </button>
                <button
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
                  onClick={() => setStagedExpressions([])}
                  type="button"
                >
                  비우기
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {stagedExpressions.map((expression) => (
                <article
                  className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                  key={expression.id}
                >
                  <div className="grid gap-2">
                    <label className="grid gap-1">
                      <span className="text-xs font-bold text-slate-500">
                        {languageOption.termLabel}
                      </span>
                      <input
                        className="min-h-10 rounded-md border-slate-200 bg-white text-base"
                        onChange={(event) =>
                          updateStagedExpression(expression.id, {
                            term: event.target.value,
                          })
                        }
                        value={expression.term}
                      />
                    </label>
                    {languageOption.readingLabel ? (
                      <label className="grid gap-1">
                        <span className="text-xs font-bold text-slate-500">
                          {languageOption.readingLabel}
                        </span>
                        <input
                          className="min-h-10 rounded-md border-slate-200 bg-white text-base"
                          onChange={(event) =>
                            updateStagedExpression(expression.id, {
                              reading: event.target.value,
                            })
                          }
                          value={expression.reading}
                        />
                      </label>
                    ) : null}
                    <label className="grid gap-1">
                      <span className="text-xs font-bold text-slate-500">뜻</span>
                      <input
                        className="min-h-10 rounded-md border-slate-200 bg-white text-base"
                        onChange={(event) =>
                          updateStagedExpression(expression.id, {
                            meaning: event.target.value,
                          })
                        }
                        placeholder="선택"
                        value={expression.meaning}
                      />
                    </label>
                  </div>
                  <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-600">
                    <input
                      checked={expression.useExample}
                      className="mt-1 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                      onChange={(event) =>
                        updateStagedExpression(expression.id, {
                          useExample: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    <span>이 문장을 예문으로 사용</span>
                  </label>
                  {expression.useExample ? (
                    <p className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-slate-500">
                      {expression.sourceSentence}
                    </p>
                  ) : null}
                  <button
                    className="justify-self-end text-sm font-bold text-red-600"
                    onClick={() =>
                      setStagedExpressions((currentExpressions) =>
                        currentExpressions.filter(
                          (currentExpression) =>
                            currentExpression.id !== expression.id,
                        ),
                      )
                    }
                    type="button"
                  >
                    제거
                  </button>
                </article>
              ))}
            </div>

            <button
              className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSavingWords}
              onClick={() => void saveStagedExpressions()}
              type="button"
            >
              단어장에 저장
            </button>
          </section>
        ) : null}
      </section>
    </>
  );
}
