import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { WordList } from "@/components/WordList";
import { isLanguage } from "@/lib/languages";

type WordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
    wordId?: string;
  }>;
};

export default async function WordsPage({ searchParams }: WordsPageProps) {
  const { lang, notebookId, wordId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : undefined;

  return (
    <AppFrame title="단어장" showHeader={false}>
      <RequireSession>
        <WordList
          highlightedWordId={wordId}
          selectedNotebookId={notebookId}
          selectedLanguage={selectedLanguage}
        />
      </RequireSession>
    </AppFrame>
  );
}
