import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { ReviewSession } from "@/components/ReviewSession";
import { buildWordListHref } from "@/components/words/word-list-links";
import { DEFAULT_LANGUAGE, getLanguageOption, isLanguage } from "@/lib/languages";

type ReviewPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
  }>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const { lang, notebookId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const language = getLanguageOption(selectedLanguage);

  return (
    <AppFrame
      title={`${language.label} 복습`}
      action={
        <Link
          href={buildWordListHref({
            language: selectedLanguage,
            notebookId,
            path: "/words",
          })}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          단어장
        </Link>
      }
    >
      <RequireSession>
        <ReviewSession
          key={`${selectedLanguage}:${notebookId ?? "all"}`}
          language={selectedLanguage}
          notebookId={notebookId}
        />
      </RequireSession>
    </AppFrame>
  );
}
