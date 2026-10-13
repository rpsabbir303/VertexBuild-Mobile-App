import { Suspense } from "react";
import { GeofenceValidationScreen } from "@/components/mobile/screens/GeofenceValidationScreen";

function GeofenceFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-brand-soft/40 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="mt-4 h-6 w-52 rounded bg-brand-soft" />
    </div>
  );
}

export default function GeofenceValidationPage() {
  return (
    <Suspense fallback={<GeofenceFallback />}>
      <GeofenceValidationScreen />
    </Suspense>
  );
}
