import { Suspense } from "react";
import { OutOfGeofenceScreen } from "@/components/mobile/screens/OutOfGeofenceScreen";

function OutOfGeofenceFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-brand-soft/40 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="mt-4 h-6 w-56 rounded bg-brand-soft" />
    </div>
  );
}

export default function OutOfGeofencePage() {
  return (
    <Suspense fallback={<OutOfGeofenceFallback />}>
      <OutOfGeofenceScreen />
    </Suspense>
  );
}
