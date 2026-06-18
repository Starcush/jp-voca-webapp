"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  authenticateWithAccount,
  sendAccountPasswordReset,
  type AccountAuthMode,
} from "@/lib/auth";
import { storeSession } from "@/lib/session";

type SubmitMode = AccountAuthMode | "reset-password";

export function LoginForm() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AccountAuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submittingMode, setSubmittingMode] = useState<SubmitMode | null>(null);
  const isSignUp = authMode === "sign-up";

  async function handleAuth(mode: AccountAuthMode) {
    setErrorMessage("");
    setSuccessMessage("");
    setSubmittingMode(mode);

    try {
      const session = await authenticateWithAccount(email, password, mode);
      storeSession(session);
      router.replace(
        session.defaultLanguage
          ? `/words?lang=${session.defaultLanguage}`
          : "/onboarding/language",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그인 중 문제가 발생했습니다.",
      );
    } finally {
      setSubmittingMode(null);
    }
  }

  async function handlePasswordReset() {
    setErrorMessage("");
    setSuccessMessage("");
    setSubmittingMode("reset-password");

    try {
      await sendAccountPasswordReset(email);
      setSuccessMessage("비밀번호 재설정 메일을 보냈습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "비밀번호 재설정 메일을 보내지 못했습니다.",
      );
    } finally {
      setSubmittingMode(null);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void handleAuth(authMode);
      }}
    >
      <div>
        <p className="text-lg font-bold text-slate-950">
          {isSignUp ? "새 계정 만들기" : "계정으로 입장"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {isSignUp
            ? "이메일은 중복 가입 방지와 계정 복구를 위해 사용합니다."
            : "가입한 이메일과 비밀번호로 단어장을 불러옵니다."}
        </p>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">이메일</span>
        <input
          autoCapitalize="none"
          autoComplete="email"
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="me@example.com"
          type="email"
          value={email}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">비밀번호</span>
        <input
          autoComplete="current-password"
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="6자 이상"
          type="password"
          value={password}
        />
        {!isSignUp ? (
          <button
            className="justify-self-end text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(submittingMode)}
            onClick={() => void handlePasswordReset()}
            type="button"
          >
            {submittingMode === "reset-password"
              ? "메일 보내는 중"
              : "비밀번호를 잊으셨나요?"}
          </button>
        ) : null}
      </label>
      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          {successMessage}
        </p>
      ) : null}
      <div className="grid gap-2">
        <button
          className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={Boolean(submittingMode)}
        >
          {submittingMode
            ? isSignUp
              ? "계정 만드는 중"
              : "로그인 중"
            : isSignUp
              ? "새 계정 만들기"
              : "로그인"}
        </button>
        <p className="text-center text-sm text-slate-500">
          {isSignUp ? "이미 계정이 있나요?" : "처음이신가요?"}{" "}
          <button
            className="font-bold text-slate-950"
            disabled={Boolean(submittingMode)}
            onClick={() => {
              setErrorMessage("");
              setSuccessMessage("");
              setAuthMode(isSignUp ? "sign-in" : "sign-up");
            }}
            type="button"
          >
            {isSignUp ? "로그인" : "새 계정 만들기"}
          </button>
        </p>
      </div>
    </form>
  );
}
