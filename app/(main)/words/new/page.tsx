import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordForm } from "@/components/WordForm";

export default function NewWordPage() {
  return (
    <AppFrame
      title="단어 추가"
      action={
        <Link
          href="/words"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          취소
        </Link>
      }
    >
      <RequireSession>
        <WordForm mode="create" />
      </RequireSession>
    </AppFrame>
  );
}
