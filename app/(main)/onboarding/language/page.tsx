import { AppFrame } from "@/components/AppFrame";
import { LanguageSetup } from "@/components/LanguageSetup";
import { RequireSession } from "@/components/RequireSession";

export default function LanguageOnboardingPage() {
  return (
    <AppFrame title="언어 선택">
      <RequireSession>
        <LanguageSetup />
      </RequireSession>
    </AppFrame>
  );
}
