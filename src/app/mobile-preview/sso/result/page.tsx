import { Suspense } from "react";
import { SsoResultScreen } from "@/components/mobile/screens/SsoResultScreen";

export default function SsoResultPage() {
  return (
    <Suspense>
      <SsoResultScreen />
    </Suspense>
  );
}
