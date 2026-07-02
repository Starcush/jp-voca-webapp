import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordForm } from "@/components/WordForm";
import { buildWordListHref } from "@/components/words/word-list-links";
import { DEFAULT_LANGUAGE, getLanguageOption, isLanguage } from "@/lib/languages";

type NewWordPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
  }>;
};

export default async function NewWordPage({ searchParams }: NewWordPageProps) {
  const { lang, notebookId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const language = getLanguageOption(selectedLanguage);

  return (
    <AppFrame
      title={`${language.label} 단어 추가`}
      action={
        <Link
          href={buildWordListHref({
            language: selectedLanguage,
            notebookId,
            path: "/words",
          })}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          취소
        </Link>
      }
    >
      <RequireSession>
        <WordForm
          language={selectedLanguage}
          mode="create"
          notebookId={notebookId}
        />
      </RequireSession>
    </AppFrame>
  );
}
