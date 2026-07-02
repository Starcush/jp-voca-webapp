import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { OcrImportForm } from "@/components/OcrImportForm";
import { RequireSession } from "@/components/RequireSession";
import { buildWordListHref } from "@/components/words/word-list-links";
import { DEFAULT_LANGUAGE, getLanguageOption, isLanguage } from "@/lib/languages";

type ImportWordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
  }>;
};

export default async function ImportWordsPage({ searchParams }: ImportWordsPageProps) {
  const { lang, notebookId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const language = getLanguageOption(selectedLanguage);

  return (
    <AppFrame
      title="사진에서 가져오기"
      eyebrow={language.label}
      action={
        <Link
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
          href={buildWordListHref({
            language: selectedLanguage,
            notebookId,
            path: "/words",
          })}
        >
          단어장
        </Link>
      }
    >
      <RequireSession>
        <OcrImportForm language={selectedLanguage} notebookId={notebookId} />
      </RequireSession>
    </AppFrame>
  );
}
