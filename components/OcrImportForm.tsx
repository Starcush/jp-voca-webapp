"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { getLanguageOption } from "@/lib/languages";
import type { Language } from "@/types/language";

type OcrImportFormProps = {
  language: Language;
};

const OCR_IMAGE_MAX_SIZE = 1800;
const OCR_IMAGE_QUALITY = 0.86;

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
  const languageOption = getLanguageOption(language);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
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
        message="사진에서 텍스트를 읽는 중"
        show={isExtracting}
      />
      <section className="grid gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-base font-bold text-slate-950">
            {languageOption.label} 책 사진 올리기
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            지금은 OCR 품질 확인 단계입니다. 추출된 텍스트를 확인한 뒤 다음 단계에서 단어 후보를 고를 수 있게 만들 예정입니다.
          </p>
          <label className="mt-4 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">사진</span>
            <input
              accept="image/*"
              capture="environment"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
              onChange={(event) => {
                setImageFile(event.target.files?.[0] ?? null);
                setExtractedText("");
                setErrorMessage("");
              }}
              type="file"
            />
          </label>
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
            onChange={(event) => setExtractedText(event.target.value)}
            placeholder="사진에서 인식된 텍스트가 여기에 표시됩니다."
            value={extractedText}
          />
        </label>
      </section>
    </>
  );
}
