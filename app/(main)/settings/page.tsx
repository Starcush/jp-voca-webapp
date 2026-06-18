import Link from "next/link";
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
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          단어장
        </Link>
      }
    >
      <RequireSession>
        <LanguageSettings />
      </RequireSession>
    </AppFrame>
  );
}
