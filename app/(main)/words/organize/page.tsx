import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { OrganizeMenu } from "@/components/organize/OrganizeMenu";
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
    <AppFrame title="단어 정리" language={selectedLanguage}>
      <RequireSession>
        <OrganizeMenu language={selectedLanguage} />
      </RequireSession>
    </AppFrame>
  );
}
