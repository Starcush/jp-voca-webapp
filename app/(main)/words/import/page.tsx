import { AppFrame } from "@/components/AppFrame";
import { OcrImportForm } from "@/components/OcrImportForm";
import { RequireSession } from "@/components/RequireSession";
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
    <AppFrame title="사진에서 가져오기" eyebrow={language.label}>
      <RequireSession>
        <OcrImportForm language={selectedLanguage} notebookId={notebookId} />
      </RequireSession>
    </AppFrame>
  );
}
