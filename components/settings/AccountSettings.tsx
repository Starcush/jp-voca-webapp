"use client";

import { signOut } from "firebase/auth";
import { AlertTriangle, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { clearStoredSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";

/**
 * 계정 관리 화면에서 현재 계정, 로그아웃, 회원탈퇴 안내를 렌더링합니다.
 *
 * @returns 로그인 세션 기반 계정 관리 UI를 렌더링합니다.
 */
export function AccountSettings() {
  const router = useRouter();
  const session = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isWithdrawalNoticeOpen, setIsWithdrawalNoticeOpen] = useState(false);

  function handleSignOut() {
    setIsSigningOut(true);
    void signOut(getFirebaseAuth()).finally(() => {
      clearStoredSession();
      router.replace("/login");
    });
  }

  if (!session) {
    return null;
  }

  return (
    <section className="flex flex-1 flex-col gap-4 pb-16">
      <section className="overflow-hidden rounded-xl border border-brand-border bg-white">
        <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 border-b border-brand-border px-4 py-4">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-background text-brand-green">
            <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-muted">계정</p>
            <p className="mt-0.5 truncate text-lg font-extrabold text-brand-text">
              {session.username}
            </p>
          </div>
        </div>
        <button
          className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-bold text-brand-muted disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSigningOut}
          onClick={handleSignOut}
          type="button"
        >
          <span className="inline-flex items-center gap-3">
            <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
            {isSigningOut ? "나가는 중" : "로그아웃"}
          </span>
        </button>
      </section>

      <section className="rounded-xl border border-status-negative-border bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-status-negative-bg text-status-negative">
            <AlertTriangle
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.2}
            />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-brand-text">
              회원탈퇴
            </h2>
            <p className="mt-1 text-sm leading-6 text-brand-muted">
              단어와 노트까지 함께 정리해야 해서 삭제 정책을 분리해서 적용할 예정입니다.
            </p>
          </div>
        </div>
        {isWithdrawalNoticeOpen ? (
          <p className="mt-3 rounded-lg bg-status-negative-bg px-3 py-2 text-sm font-semibold leading-6 text-status-negative">
            지금은 계정 삭제 전에 단어/노트 데이터 삭제 방식과 복구 불가 안내를 먼저 정리하는 단계입니다.
          </p>
        ) : null}
        <button
          className="mt-3 min-h-11 w-full rounded-lg border border-status-negative-border bg-white px-4 text-sm font-black text-status-negative"
          onClick={() =>
            setIsWithdrawalNoticeOpen((currentValue) => !currentValue)
          }
          type="button"
        >
          {isWithdrawalNoticeOpen ? "안내 닫기" : "회원탈퇴 안내 보기"}
        </button>
      </section>
    </section>
  );
}
