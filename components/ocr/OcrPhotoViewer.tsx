import type { PointerEvent, RefObject } from "react";
import { Highlighter, Plus, X, ZoomIn, ZoomOut } from "lucide-react";
import { getTokenHighlightColor } from "@/components/ocr/ocr-photo-utils";
import type { OcrTextBox } from "@/types/ocr";

type PanOffset = {
  x: number;
  y: number;
};

type OcrPhotoViewerProps = {
  imageOverlayRef: RefObject<HTMLDivElement | null>;
  isSelectMode: boolean;
  onAddSelectedText: () => void;
  onClearDrag: () => void;
  onClearSelection: () => void;
  onHighlightModeToggle: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  panOffset: PanOffset;
  previewUrl: string;
  selectedText: string;
  selectedTokenIds: Set<string>;
  showModeHint: boolean;
  tokens: OcrTextBox[];
  zoomScale: number;
};

function getHighlightStyle(token: OcrTextBox, isSelected: boolean) {
  const isHorizontal = token.width >= token.height;
  const left = isHorizontal ? token.x + token.width * 0.04 : token.x + token.width * 0.22;
  const top = isHorizontal ? token.y + token.height * 0.48 : token.y + token.height * 0.04;
  const width = isHorizontal ? token.width * 0.92 : token.width * 0.56;
  const height = isHorizontal ? token.height * 0.42 : token.height * 0.92;

  return {
    backgroundColor: getTokenHighlightColor(isSelected),
    height: `${Math.max(height * 100, 1.3)}%`,
    left: `${left * 100}%`,
    top: `${top * 100}%`,
    width: `${Math.max(width * 100, 1.3)}%`,
  };
}

/**
 * 사진 위 OCR 텍스트 영역, 확대/축소, 이동/형광펜 선택 UI를 렌더링합니다.
 *
 * @param props - 사진 미리보기, OCR 토큰, 선택 상태, 확대/이동 상태와 포인터 이벤트 핸들러입니다.
 * @returns 사진 위 하이라이트 선택과 선택 텍스트 추가 UI를 렌더링합니다.
 */
export function OcrPhotoViewer({
  imageOverlayRef,
  isSelectMode,
  onAddSelectedText,
  onClearDrag,
  onClearSelection,
  onHighlightModeToggle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onZoomIn,
  onZoomOut,
  panOffset,
  previewUrl,
  selectedText,
  selectedTokenIds,
  showModeHint,
  tokens,
  zoomScale,
}: OcrPhotoViewerProps) {
  return (
    <div className="grid gap-3">
      {tokens.length > 0 ? (
        <div className="flex items-center justify-end gap-2">
          <button
            aria-label="사진 축소"
            className="grid size-9 place-items-center rounded-lg border border-brand-border bg-white text-brand-text disabled:cursor-not-allowed disabled:text-brand-muted-soft"
            disabled={zoomScale <= 1}
            onClick={onZoomOut}
            type="button"
          >
            <ZoomOut aria-hidden className="size-4" />
          </button>
          <button
            aria-label="사진 확대"
            className="grid size-9 place-items-center rounded-lg border border-brand-border bg-white text-brand-text disabled:cursor-not-allowed disabled:text-brand-muted-soft"
            disabled={zoomScale >= 3}
            onClick={onZoomIn}
            type="button"
          >
            <ZoomIn aria-hidden className="size-4" />
          </button>
          <div className="relative">
            {showModeHint ? (
              <div className="pointer-events-none absolute -top-8 right-0 z-20 whitespace-nowrap rounded-full bg-brand-text px-2.5 py-1 text-[11px] font-black text-white shadow-lg">
                선택 비활성화
              </div>
            ) : null}
            <button
              aria-label={isSelectMode ? "형광펜 선택 모드" : "사진 이동 모드"}
              aria-pressed={isSelectMode}
              className={`grid size-9 place-items-center rounded-lg border text-brand-text disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelectMode
                  ? "border-primary bg-primary text-white"
                  : "border-brand-border bg-white"
              }`}
              disabled={zoomScale <= 1}
              onClick={onHighlightModeToggle}
              type="button"
            >
              <Highlighter aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-background p-2">
        <div
          className="relative mx-auto w-fit max-w-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews are not served through Next image optimization. */}
          <img
            alt="OCR 선택 미리보기"
            className="block max-h-[70vh] max-w-full object-contain"
            src={previewUrl}
          />
          {tokens.length > 0 ? (
            <div
              aria-label="사진 위 텍스트 선택 영역"
              className={`absolute inset-0 select-none touch-none ${
                isSelectMode ? "cursor-crosshair" : "cursor-grab"
              }`}
              onPointerDown={onPointerDown}
              onPointerLeave={onClearDrag}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              ref={imageOverlayRef}
              role="application"
              tabIndex={0}
              title="사진 위를 드래그해서 텍스트를 선택하세요"
            >
              {tokens.map((token) => {
                const isSelected = selectedTokenIds.has(token.id);

                return (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-full transition-colors"
                    key={token.id}
                    style={getHighlightStyle(token, isSelected)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {tokens.length > 0 ? (
        <div className="grid gap-3 rounded-lg border border-brand-border bg-white p-3">
          <div className="flex items-start gap-2">
            <Highlighter
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <div className="min-w-0">
              <p className="text-sm font-black text-brand-text">
                드래그해서 글자를 선택하세요
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-brand-muted">
                선택된 영역은 진하게 표시됩니다. 다시 쓸면 선택을 지울 수 있어요.
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg bg-brand-background px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-bold text-brand-text">
                {selectedText || "선택한 텍스트가 여기에 표시됩니다."}
              </p>
              {selectedText ? (
                <button
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-black text-brand-muted transition-colors hover:bg-white hover:text-brand-text"
                  onClick={onClearSelection}
                  type="button"
                >
                  <X aria-hidden className="size-3.5" />
                  선택 지우기
                </button>
              ) : null}
            </div>
          </div>

          <button
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
            disabled={!selectedText}
            onClick={onAddSelectedText}
            type="button"
          >
            <Plus aria-hidden className="size-4" />
            선택한 표현 추가
          </button>
        </div>
      ) : null}
    </div>
  );
}
