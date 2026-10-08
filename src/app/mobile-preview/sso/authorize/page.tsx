import { Suspense } from "react";
import { SsoAuthorizeScreen } from "@/components/mobile/screens/SsoAuthorizeScreen";

export default function SsoAuthorizePage() {
  return (
    <Suspense>
      <SsoAuthorizeScreen />
    </Suspense>
  );
}
