import { AuthAccountSync } from "@/components/mobile/AuthAccountSync";
import { BiometricSessionLockListener } from "@/components/mobile/auth/BiometricSessionLockListener";
import { OfflineConnectivityBridge } from "@/components/mobile/auth/OfflineConnectivityBridge";
import { SessionLifecycleListener } from "@/components/mobile/auth/SessionLifecycleListener";
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
      <BiometricSessionLockListener />
      <MobileAppProvider>
        <SessionLifecycleListener />
        <OfflineConnectivityBridge />
        <AuthAccountSync />
        <MobilePreviewFrame>
          <MobileRouteShell>{children}</MobileRouteShell>
        </MobilePreviewFrame>
      </MobileAppProvider>
    </MobileAuthProvider>
  );
}
