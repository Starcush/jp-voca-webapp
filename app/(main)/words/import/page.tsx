import { AppFrame } from "@/components/AppFrame";
import { OcrImportForm } from "@/components/OcrImportForm";
import type { OcrImportMode } from "@/components/ocr/types";
import { RequireSession } from "@/components/RequireSession";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type ImportWordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    mode?: string;
    notebookId?: string;
  }>;
};

export default async function ImportWordsPage({ searchParams }: ImportWordsPageProps) {
  const { lang, mode, notebookId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const initialMode: OcrImportMode = mode === "photo" ? "photo" : "sentence";

  return (
    <AppFrame title="사진에서 가져오기" language={selectedLanguage}>
      <RequireSession>
        <OcrImportForm
          key={`${selectedLanguage}:${notebookId ?? "unfiled"}`}
          initialMode={initialMode}
          language={selectedLanguage}
          notebookId={notebookId}
        />
      </RequireSession>
    </AppFrame>
  );
}
