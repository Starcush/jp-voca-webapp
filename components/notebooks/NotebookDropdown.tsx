"use client";

import { BookOpenText, ChevronDown, ChevronUp } from "lucide-react";

/**
 * 공통 노트 드롭다운에서 선택 가능한 한 줄 옵션입니다.
 *
 * @property key - React 렌더링과 선택 상태 비교에 사용하는 안정적인 키입니다.
 * @property label - 사용자에게 보여줄 노트 또는 필터 이름입니다.
 * @property meta - 우측에 보조로 보여줄 개수 등의 짧은 정보입니다.
 * @property value - 선택 시 상위 화면으로 전달할 노트 ID입니다. 전체/미분류처럼 ID가 없으면 생략합니다.
 */
export type NotebookDropdownOption = {
  key: string;
  label: string;
  meta?: string;
  value?: string;
};

type NotebookDropdownProps = {
  ariaLabel?: string;
  buttonLabel: string;
  buttonLayout?: "full" | "inline";
  buttonMeta?: string;
  className?: string;
  disabled?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  isOpen: boolean;
  label?: string;
  loadingLabel?: string;
  menuPosition?: "absolute" | "static";
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (notebookId?: string) => void;
  options: NotebookDropdownOption[];
  selectedKey?: string;
  warningMessage?: string;
};

/**
 * 목록, 가져오기 등 여러 화면에서 사용하는 노트 선택 드롭다운입니다.
 *
 * @param props - 현재 열림 상태, 선택 옵션, 표시 라벨과 선택 콜백입니다.
 * @param props.ariaLabel - 노트 선택 버튼의 접근성 라벨입니다.
 * @param props.buttonLabel - 버튼 본문에 표시할 현재 노트 이름입니다.
 * @param props.buttonLayout - 버튼을 부모 너비 전체로 쓸지, 내용 너비로 쓸지 결정합니다.
 * @param props.buttonMeta - 버튼 우측에 표시할 개수 등의 보조 정보입니다.
 * @param props.className - 최상위 wrapper에 추가할 클래스입니다.
 * @param props.disabled - 버튼 비활성화 여부입니다.
 * @param props.errorMessage - 드롭다운 내부 상단에 표시할 오류 문구입니다.
 * @param props.isLoading - 노트 목록을 불러오는 중인지 여부입니다.
 * @param props.isOpen - 드롭다운 열림 상태입니다.
 * @param props.label - 버튼 위에 표시할 작은 라벨입니다.
 * @param props.loadingLabel - 로딩 중 표시할 문구입니다.
 * @param props.menuPosition - 메뉴를 문서 흐름에 둘지, 버튼 아래에 띄울지 결정합니다.
 * @param props.onOpenChange - 드롭다운 열림 상태 변경 콜백입니다.
 * @param props.onSelect - 옵션 선택 시 호출되는 콜백입니다.
 * @param props.options - 선택 가능한 노트 옵션 목록입니다.
 * @param props.selectedKey - 현재 선택된 옵션 키입니다.
 * @param props.warningMessage - 버튼 아래에 표시할 경고 문구입니다.
 * @returns 공통 노트 선택 드롭다운 UI를 렌더링합니다.
 */
export function NotebookDropdown({
  ariaLabel,
  buttonLabel,
  buttonLayout = "full",
  buttonMeta,
  className,
  disabled,
  errorMessage,
  isLoading,
  isOpen,
  label,
  loadingLabel = "노트를 불러오는 중",
  menuPosition = "absolute",
  onOpenChange,
  onSelect,
  options,
  selectedKey,
  warningMessage,
}: NotebookDropdownProps) {
  const buttonWidthClass =
    buttonLayout === "inline"
      ? "inline-flex max-w-full"
      : "flex w-full";
  const menuPositionClass =
    menuPosition === "absolute"
      ? "absolute left-0 top-full z-30 mt-2"
      : "mt-2";

  function handleOptionSelect(option: NotebookDropdownOption) {
    onSelect(option.value);
    onOpenChange(false);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {label ? (
        <p className="mb-2 text-xs font-bold text-brand-muted">{label}</p>
      ) : null}
      <button
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`${buttonWidthClass} min-w-0 items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2 text-left text-sm font-bold text-brand-text shadow-sm ${
          warningMessage ? "border-primary-border" : ""
        }`}
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
        type="button"
      >
        <BookOpenText
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          strokeWidth={2.2}
        />
        <span className="min-w-0 flex-1 truncate">{buttonLabel}</span>
        {buttonMeta ? (
          <span className="shrink-0 text-xs text-brand-muted">
            {buttonMeta}
          </span>
        ) : null}
        {isLoading ? (
          <span className="shrink-0 text-xs text-brand-muted">확인 중</span>
        ) : null}
        {isOpen ? (
          <ChevronUp
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-brand-muted"
            strokeWidth={2.2}
          />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-brand-muted"
            strokeWidth={2.2}
          />
        )}
      </button>

      {warningMessage ? (
        <p className="mt-2 rounded-lg bg-primary-tint px-3 py-2 text-xs font-semibold leading-5 text-primary-text">
          {warningMessage}
        </p>
      ) : null}

      {isOpen ? (
        <div
          className={`${menuPositionClass} grid max-h-72 w-full gap-2 overflow-y-auto rounded-xl border border-brand-border bg-white p-2 text-brand-text shadow-lg`}
        >
          {errorMessage ? (
            <p className="rounded-lg bg-status-negative-bg px-3 py-2 text-xs font-bold text-status-negative">
              {errorMessage}
            </p>
          ) : null}
          {options.map((option) => (
            <button
              aria-pressed={selectedKey === option.key}
              className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-sm font-bold ${
                selectedKey === option.key
                  ? "bg-brand-green text-white"
                  : "text-brand-muted hover:bg-brand-background"
              }`}
              key={option.key}
              onClick={() => handleOptionSelect(option)}
              type="button"
            >
              <span className="truncate">{option.label}</span>
              {option.meta ? (
                <span className="shrink-0 text-xs opacity-70">
                  {option.meta}
                </span>
              ) : null}
            </button>
          ))}
          {isLoading ? (
            <p className="px-3 py-2 text-sm font-bold text-brand-muted-soft">
              {loadingLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
