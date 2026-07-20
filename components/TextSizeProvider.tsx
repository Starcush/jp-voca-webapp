"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/users";
import { useSession } from "@/lib/use-session";
import type { TextSizePreference } from "@/types/user";

type TextSizeProviderProps = {
  children: ReactNode;
};

function normalizeTextSize(value?: TextSizePreference) {
  return value === "large" ? "large" : "default";
}

/**
 * Firestore 사용자 설정의 글자 크기를 앱 전역 HTML 속성으로 반영합니다.
 *
 * @param props - 앱 하위 트리입니다.
 * @param props.children - 글자 크기 설정을 적용할 앱 콘텐츠입니다.
 * @returns 앱 콘텐츠와 전역 글자 크기 side effect를 함께 렌더링합니다.
 */
export function TextSizeProvider({ children }: TextSizeProviderProps) {
  const session = useSession();
  const uid = session?.uid ?? "";
  const userQuery = useQuery({
    queryKey: ["userSettings", uid],
    enabled: Boolean(uid),
    queryFn: () => getUser(uid),
  });
  const textSize = normalizeTextSize(
    userQuery.data?.textSize ?? session?.textSize,
  );

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  return children;
}
