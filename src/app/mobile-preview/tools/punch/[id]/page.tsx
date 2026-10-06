import { PunchDetailScreen } from "@/components/mobile/screens/PunchDetailScreen";

export default function PunchDetailPage({ params }: { params: { id: string } }) {
  return <PunchDetailScreen punchId={params.id} />;
}
