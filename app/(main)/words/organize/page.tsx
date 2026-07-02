import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordOrganizer } from "@/components/organize/WordOrganizer";
import { buildWordListHref } from "@/components/words/word-list-links";
import { DEFAULT_LANGUAGE, getLanguageOption, isLanguage } from "@/lib/languages";

type OrganizeWordsPageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function OrganizeWordsPage({
  searchParams,
}: OrganizeWordsPageProps) {
  const { lang } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const language = getLanguageOption(selectedLanguage);

  return (
    <AppFrame
      title="단어 정리"
      eyebrow={language.label}
      action={
        <Link
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
          href={buildWordListHref({
            language: selectedLanguage,
            path: "/words",
          })}
        >
          단어장
        </Link>
      }
    >
      <RequireSession>
        <WordOrganizer language={selectedLanguage} />
      </RequireSession>
    </AppFrame>
  );
}
