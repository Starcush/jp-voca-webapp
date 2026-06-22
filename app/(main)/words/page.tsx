import { AppFrame } from "@/components/AppFrame";
import { AuthStatus } from "@/components/AuthStatus";
import { RequireSession } from "@/components/RequireSession";
import { WordList } from "@/components/WordList";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type WordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    wordId?: string;
  }>;
};

export default async function WordsPage({ searchParams }: WordsPageProps) {
  const { lang, wordId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : undefined;
  const reviewLanguage = selectedLanguage ?? DEFAULT_LANGUAGE;

  return (
    <AppFrame
      title="단어장"
      action={<AuthStatus reviewLanguage={reviewLanguage} />}
    >
      <RequireSession>
        <WordList
          highlightedWordId={wordId}
          selectedLanguage={selectedLanguage}
        />
      </RequireSession>
    </AppFrame>
  );
}
