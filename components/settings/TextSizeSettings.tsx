"use client";

import { Check, Type } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { storeSession } from "@/lib/session";
import { getUser, updateUserTextSizeSetting } from "@/lib/users";
import { useSession } from "@/lib/use-session";
import type { AppUser, TextSizePreference } from "@/types/user";

const textSizeOptions: Array<{
  description: string;
  label: string;
  previewClassName: string;
  value: TextSizePreference;
}> = [
  {
    description: "현재 앱에서 쓰는 기본 글자 크기입니다.",
    label: "기본",
    previewClassName: "text-base",
    value: "default",
  },
  {
    description: "목록, 버튼, 복습 카드 글자가 조금 더 크게 보입니다.",
    label: "크게",
    previewClassName: "text-lg",
    value: "large",
  },
];

/**
 * 앱 전체 글자 크기 설정을 Firestore 사용자 문서에 저장하는 화면입니다.
 *
 * @returns 글자 크기 선택 옵션과 저장 액션을 렌더링합니다.
 */
export function TextSizeSettings() {
  const session = useSession();
  const queryClient = useQueryClient();
  const uid = session?.uid ?? "";
  const userQuery = useQuery({
    queryKey: ["userSettings", uid],
    enabled: Boolean(uid),
    queryFn: () => getUser(uid),
  });
  const persistedTextSize = userQuery.data?.textSize ?? session?.textSize ?? "default";
  const [draftTextSize, setDraftTextSize] =
    useState<TextSizePreference | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const selectedTextSize = draftTextSize ?? persistedTextSize;

  async function handleSave() {
    if (!session) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      await updateUserTextSizeSetting(session.uid, selectedTextSize);
      storeSession({
        ...session,
        textSize: selectedTextSize,
      });
      queryClient.setQueryData<AppUser | null>(
        ["userSettings", session.uid],
        (currentUser) =>
          currentUser
            ? {
                ...currentUser,
                textSize: selectedTextSize,
              }
            : currentUser,
      );
      setDraftTextSize(null);
      setSuccessMessage("글자 크기를 저장했습니다.");
    } catch {
      setErrorMessage("글자 크기를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <section className="flex flex-1 flex-col gap-4 pb-16">
      <div className="flex items-start gap-3 px-1">
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-background text-brand-green">
          <Type aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold tracking-normal text-brand-text">
            글자 크기
          </h2>
          <p className="mt-1 text-sm leading-6 text-brand-muted">
            단어장, 복습, 버튼 글자를 보기 편한 크기로 조정합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {textSizeOptions.map((option) => {
          const isSelected = selectedTextSize === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border bg-white p-4 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected ? "border-brand-green" : "border-brand-border"
              }`}
              disabled={isSaving}
              key={option.value}
              onClick={() => {
                setDraftTextSize(option.value);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              type="button"
            >
              <span className="min-w-0">
                <span className="block text-base font-extrabold text-brand-text">
                  {option.label}
                </span>
                <span className="mt-1 block text-sm leading-6 text-brand-muted">
                  {option.description}
                </span>
                <span
                  className={`mt-3 block font-japanese font-semibold text-word-kanji ${option.previewClassName}`}
                >
                  勉強する 단어장
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 place-items-center rounded-full ${
                  isSelected
                    ? "bg-brand-green text-white"
                    : "border border-brand-border text-brand-muted-soft"
                }`}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-status-negative-bg px-3 py-2 text-sm font-semibold text-status-negative">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg bg-primary-tint px-3 py-2 text-sm font-bold text-primary-text">
          {successMessage}
        </p>
      ) : null}

      <button
        className="mt-auto min-h-12 rounded-lg bg-primary px-4 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving}
        onClick={() => void handleSave()}
        type="button"
      >
        {isSaving ? "저장 중" : "설정 저장"}
      </button>
    </section>
  );
}
