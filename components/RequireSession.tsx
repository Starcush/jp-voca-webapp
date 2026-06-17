"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/use-session";

type RequireSessionProps = {
  children: ReactNode;
};

export function RequireSession({ children }: RequireSessionProps) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [router, session]);

  if (session === undefined) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">확인 중</p>
      </section>
    );
  }

  if (!session) {
    return null;
  }

  return children;
}
