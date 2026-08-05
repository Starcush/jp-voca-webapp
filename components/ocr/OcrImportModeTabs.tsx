import { FileText, Highlighter } from "lucide-react";
import type { OcrImportMode } from "@/components/ocr/types";

type OcrImportModeTabsProps = {
  mode: OcrImportMode;
  onChange: (mode: OcrImportMode) => void;
};

const modeOptions: Array<{
  icon: typeof FileText;
  label: string;
  value: OcrImportMode;
}> = [
  { icon: FileText, label: "문장별로 고르기", value: "sentence" },
  { icon: Highlighter, label: "사진에서 고르기", value: "photo" },
];

/**
 * OCR 결과에서 문장을 고르는 방식을 전환하는 상단 탭입니다.
 *
 * @param props - 현재 모드와 모드 변경 콜백입니다.
 * @returns 문장별 선택과 사진 위 선택 탭을 렌더링합니다.
 */
export function OcrImportModeTabs({ mode, onChange }: OcrImportModeTabsProps) {
  return (
    <div
      aria-label="문장 선택 방식"
      className="grid grid-cols-2 gap-1 rounded-xl bg-brand-background p-1 shadow-sm"
      role="tablist"
    >
      {modeOptions.map((option) => {
        const isSelected = option.value === mode;

        return (
          <button
            aria-selected={isSelected}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition-colors ${
              isSelected
                ? "bg-primary text-white shadow-sm"
                : "text-brand-muted hover:bg-white/70"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="tab"
            type="button"
          >
            <option.icon aria-hidden className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
