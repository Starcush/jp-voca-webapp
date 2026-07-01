"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/types/language";

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

/**
 * OCR 이미지 선택, 미리보기 URL, 이미지 리사이즈, 텍스트 추출 요청을 관리합니다.
 *
 * @param language - OCR 요청에 사용할 현재 언어 코드입니다.
 * @returns 선택된 이미지 파일, 미리보기 URL, 추출 로딩 상태, 이미지 변경 함수, 텍스트 추출 함수를 반환합니다.
 */
export function useOcrImage(language: Language) {
  const [imageFile, setImageFile] = useState<File | null>(null);
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

  async function extractText() {
    if (!imageFile) {
      throw new Error("사진을 먼저 선택해주세요.");
    }

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
        error?: unknown;
        text?: unknown;
      } | null;

      if (!response.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "텍스트를 추출하지 못했습니다.",
        );
      }

      return typeof body?.text === "string" ? body.text : "";
    } finally {
      setIsExtracting(false);
    }
  }

  return {
    extractText,
    imageFile,
    isExtracting,
    previewUrl,
    setImageFile,
  };
}
