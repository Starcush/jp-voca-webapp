"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInWithUsername } from "@/lib/auth";
import { storeSession } from "@/lib/session";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await signInWithUsername(username);
      storeSession(session);
      router.replace("/words");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그인 중 문제가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-lg font-bold text-slate-950">username으로 입장</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          같은 username을 쓰면 같은 단어장으로 들어갑니다.
        </p>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">username</span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="starcush"
          value={username}
        />
      </label>
      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <button
        className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "입장 중" : "입장하기"}
      </button>
    </form>
  );
}

