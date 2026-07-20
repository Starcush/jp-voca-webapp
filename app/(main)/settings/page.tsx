import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { SettingsMenu } from "@/components/settings/SettingsMenu";

export default function SettingsPage() {
  return (
    <AppFrame title="설정" backHref="/words">
      <RequireSession>
        <SettingsMenu />
      </RequireSession>
    </AppFrame>
  );
}
