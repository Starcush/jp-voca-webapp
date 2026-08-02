import type { PointerEvent, RefObject } from "react";
import { Highlighter, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  getTokenHighlightColor,
  getTokenOutlineColor,
} from "@/components/ocr/ocr-photo-utils";
import type { OcrHighlightRegion } from "@/components/ocr/ocr-photo-utils";

type PanOffset = {
  x: number;
  y: number;
};

type OcrPhotoViewerProps = {
  highlightRegions: OcrHighlightRegion[];
  imageOverlayRef: RefObject<HTMLDivElement | null>;
  isSelectMode: boolean;
  onClearInteraction: () => void;
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
  zoomScale: number;
};

function getHighlightStyle(
  region: OcrHighlightRegion,
  isSelected: boolean,
) {
  return {
    backgroundColor: getTokenHighlightColor(isSelected),
    boxShadow: `inset 0 0 0 0.75px ${getTokenOutlineColor(isSelected)}`,
    boxSizing: "border-box" as const,
    height: `${region.height * 100}%`,
    left: `${region.x * 100}%`,
    top: `${region.y * 100}%`,
    width: `${region.width * 100}%`,
  };
}

/**
 * 사진 위 OCR 문장 영역, 확대/축소, 이동/선택 UI를 렌더링합니다.
 *
 * @param props - 사진 미리보기, OCR 토큰, 선택 상태, 확대/이동 상태와 포인터 이벤트 핸들러입니다.
 * @returns 사진 위 문장 후보 선택과 확대·이동 UI를 렌더링합니다.
 */
export function OcrPhotoViewer({
  highlightRegions,
  imageOverlayRef,
  isSelectMode,
  onClearInteraction,
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
  zoomScale,
}: OcrPhotoViewerProps) {
  return (
    <div className="grid gap-3">
      {highlightRegions.length > 0 ? (
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
          {highlightRegions.length > 0 ? (
            <div
              aria-label="사진 위 텍스트 선택 영역"
              className={`absolute inset-0 select-none touch-none ${
                isSelectMode ? "cursor-crosshair" : "cursor-grab"
              }`}
              onPointerDown={onPointerDown}
              onPointerLeave={onClearInteraction}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              ref={imageOverlayRef}
              role="application"
              tabIndex={0}
              title="모르는 단어가 있는 문장을 탭하세요"
            >
              {highlightRegions.map((region) => {
                const isSelected = region.tokenIds.some((tokenId) =>
                  selectedTokenIds.has(tokenId),
                );

                return (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-[2px] transition-[background-color,box-shadow] duration-150"
                    key={region.id}
                    style={getHighlightStyle(region, isSelected)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {highlightRegions.length > 0 ? (
        <div className="grid gap-3 rounded-lg border border-brand-border bg-white p-3">
          <div className="flex items-start gap-2">
            <Highlighter
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <div className="min-w-0">
              <p className="text-sm font-black text-brand-text">
                모르는 단어가 있는 문장을 탭하세요
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-brand-muted">
                앱이 문장 범위를 제안하고, 아래에서 여러 표현을 고를 수 있어요.
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg bg-brand-background px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-bold text-brand-text">
                {selectedText || "선택한 문장이 여기에 표시됩니다."}
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

        </div>
      ) : null}
    </div>
  );
}
