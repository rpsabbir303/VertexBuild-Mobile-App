import { Suspense } from "react";
import { InviteEntryScreen } from "@/components/mobile/screens/InviteEntryScreen";

export default function MobileInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-soft-sky" aria-hidden="true">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-line border-t-brand-blue" />
        </div>
      }
    >
      <InviteEntryScreen />
    </Suspense>
  );
}
