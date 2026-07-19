import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";
import { LanguageSettings } from "@/components/LanguageSettings";
import { RequireSession } from "@/components/RequireSession";

export default function SettingsPage() {
  return (
    <AppFrame
      title="설정"
      action={
        <Link
          href="/words"
          className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
          돌아가기
        </Link>
      }
    >
      <RequireSession>
        <LanguageSettings />
      </RequireSession>
    </AppFrame>
  );
}
