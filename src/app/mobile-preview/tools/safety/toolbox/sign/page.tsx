import { Suspense } from "react";
import { SafetyToolboxSignatureScreen } from "@/components/mobile/screens/SafetyToolboxSignatureScreen";

export default function ToolboxSignPage() {
  return (
    <Suspense fallback={null}>
      <SafetyToolboxSignatureScreen />
    </Suspense>
  );
}
