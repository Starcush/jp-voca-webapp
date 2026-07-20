import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function AccountSettingsPage() {
  return (
    <AppFrame title="계정 관리" backHref="/settings">
      <RequireSession>
        <AccountSettings />
      </RequireSession>
    </AppFrame>
  );
}
