import { AppFrame } from "@/components/AppFrame";
import { OcrImportForm } from "@/components/OcrImportForm";
import { RequireSession } from "@/components/RequireSession";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type ImportWordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
  }>;
};

export default async function ImportWordsPage({ searchParams }: ImportWordsPageProps) {
  const { lang, notebookId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return (
    <AppFrame title="사진에서 가져오기" language={selectedLanguage}>
      <RequireSession>
        <OcrImportForm
          key={`${selectedLanguage}:${notebookId ?? "unfiled"}`}
          language={selectedLanguage}
          notebookId={notebookId}
        />
      </RequireSession>
    </AppFrame>
  );
}
