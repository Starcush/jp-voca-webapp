import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { NotebookManager } from "@/components/organize/NotebookManager";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type OrganizeNotebooksPageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function OrganizeNotebooksPage({
  searchParams,
}: OrganizeNotebooksPageProps) {
  const { lang } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return (
    <AppFrame
      backHref={`/words/organize?lang=${selectedLanguage}`}
      language={selectedLanguage}
      title="노트 관리"
    >
      <RequireSession>
        <NotebookManager language={selectedLanguage} />
      </RequireSession>
    </AppFrame>
  );
}
