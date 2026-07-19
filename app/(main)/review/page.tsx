import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { ReviewSession } from "@/components/ReviewSession";
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
    <AppFrame title={`${language.label} 복습`}>
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
