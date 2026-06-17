import { AppFrame } from "@/components/AppFrame";
import { AuthStatus } from "@/components/AuthStatus";
import { RequireSession } from "@/components/RequireSession";
import { WordList } from "@/components/WordList";

export default function WordsPage() {
  return (
    <AppFrame
      title="단어장"
      action={<AuthStatus />}
    >
      <RequireSession>
        <WordList />
      </RequireSession>
    </AppFrame>
  );
}
