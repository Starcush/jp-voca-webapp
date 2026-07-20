import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordOrganizer } from "@/components/organize/WordOrganizer";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

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

  return (
    <AppFrame
      backHref={`/words/organize?lang=${selectedLanguage}`}
      language={selectedLanguage}
      title="단어 관리"
    >
      <RequireSession>
        <WordOrganizer language={selectedLanguage} />
      </RequireSession>
    </AppFrame>
  );
}
