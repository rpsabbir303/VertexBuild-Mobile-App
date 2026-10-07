import { DrawingViewerScreen } from "@/components/mobile/screens/DrawingViewerScreen";

export default function DrawingDetailPage({ params }: { params: { id: string } }) {
  return <DrawingViewerScreen drawingId={params.id} />;
}
