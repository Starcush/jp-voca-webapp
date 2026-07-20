import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordOrganizer } from "@/components/organize/WordOrganizer";
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
    <AppFrame title="단어 관리" eyebrow={language.flag}>
      <RequireSession>
        <WordOrganizer language={selectedLanguage} />
      </RequireSession>
    </AppFrame>
  );
}
