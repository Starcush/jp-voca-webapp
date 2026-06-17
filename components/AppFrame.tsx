import Link from "next/link";
import type { ReactNode } from "react";

type AppFrameProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AppFrame({ title, eyebrow, action, children }: AppFrameProps) {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-4 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between gap-4 pb-4">
          <Link href="/words" className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="truncate text-2xl font-bold tracking-normal text-slate-950">
              {title}
            </h1>
          </Link>
          {action}
        </header>
        {children}
      </div>
    </main>
  );
}
