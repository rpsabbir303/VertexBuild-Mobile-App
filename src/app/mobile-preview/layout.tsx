import { AuthAccountSync } from "@/components/mobile/AuthAccountSync";
import { MobileAppProvider } from "@/lib/mobile/MobileAppContext";
import { MobileAuthProvider } from "@/lib/mobile/MobileAuthContext";
import { MobilePreviewFrame } from "@/components/mobile/MobilePreviewFrame";
import { MobileRouteShell } from "@/components/mobile/MobileRouteShell";

export default function MobilePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileAuthProvider>
      <MobileAppProvider>
        <AuthAccountSync />
        <MobilePreviewFrame>
          <MobileRouteShell>{children}</MobileRouteShell>
        </MobilePreviewFrame>
      </MobileAppProvider>
    </MobileAuthProvider>
  );
}
