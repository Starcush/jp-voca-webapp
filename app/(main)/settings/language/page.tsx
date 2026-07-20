import { AppFrame } from "@/components/AppFrame";
import { LanguageSettings } from "@/components/LanguageSettings";
import { RequireSession } from "@/components/RequireSession";

export default function LanguageSettingsPage() {
  return (
    <AppFrame title="언어 관리" backHref="/settings">
      <RequireSession>
        <LanguageSettings />
      </RequireSession>
    </AppFrame>
  );
}
