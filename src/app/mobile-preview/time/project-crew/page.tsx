import { Suspense } from "react";
import { ProjectCrewSelectionScreen } from "@/components/mobile/screens/ProjectCrewSelectionScreen";

function ProjectCrewFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-brand-soft/40 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="mt-4 h-6 w-48 rounded bg-brand-soft" />
    </div>
  );
}

export default function ProjectCrewPage() {
  return (
    <Suspense fallback={<ProjectCrewFallback />}>
      <ProjectCrewSelectionScreen />
    </Suspense>
  );
}
