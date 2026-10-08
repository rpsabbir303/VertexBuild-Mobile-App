import { Suspense } from "react";
import { SsoCallbackScreen } from "@/components/mobile/screens/SsoCallbackScreen";

export default function SsoCallbackPage() {
  return (
    <Suspense>
      <SsoCallbackScreen />
    </Suspense>
  );
}
