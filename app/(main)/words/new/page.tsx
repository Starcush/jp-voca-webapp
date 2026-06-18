import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordForm } from "@/components/WordForm";
import { DEFAULT_LANGUAGE, getLanguageOption, isLanguage } from "@/lib/languages";

type NewWordPageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function NewWordPage({ searchParams }: NewWordPageProps) {
  const { lang } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const language = getLanguageOption(selectedLanguage);

  return (
    <AppFrame
      title={`${language.label} 단어 추가`}
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
        <WordForm mode="create" />
      </RequireSession>
    </AppFrame>
  );
}
