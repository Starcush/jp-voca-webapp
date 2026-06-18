import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordForm } from "@/components/WordForm";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type EditWordPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function EditWordPage({
  params,
  searchParams,
}: EditWordPageProps) {
  const { id } = await params;
  const { lang } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return (
    <AppFrame
      title="단어 수정"
      eyebrow={id}
      action={
        <Link
          href={`/words?lang=${selectedLanguage}`}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          취소
        </Link>
      }
    >
      <RequireSession>
        <WordForm language={selectedLanguage} mode="edit" wordId={id} />
      </RequireSession>
    </AppFrame>
  );
}
