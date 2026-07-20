import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { TextSizeSettings } from "@/components/settings/TextSizeSettings";

export default function TextSizeSettingsPage() {
  return (
    <AppFrame title="글자 크기" backHref="/settings">
      <RequireSession>
        <TextSizeSettings />
      </RequireSession>
    </AppFrame>
  );
}
