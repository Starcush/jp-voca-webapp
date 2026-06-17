import { AppFrame } from "@/components/AppFrame";
import { AuthStatus } from "@/components/AuthStatus";
import { RequireSession } from "@/components/RequireSession";
import { WordList } from "@/components/WordList";

type WordsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function WordsPage({ searchParams }: WordsPageProps) {
  const { saved } = await searchParams;
  const saveStatus = saved === "created" || saved === "updated" ? saved : undefined;

  return (
    <AppFrame
      title="단어장"
      action={<AuthStatus />}
    >
      <RequireSession>
        <WordList saveStatus={saveStatus} />
      </RequireSession>
    </AppFrame>
  );
}
