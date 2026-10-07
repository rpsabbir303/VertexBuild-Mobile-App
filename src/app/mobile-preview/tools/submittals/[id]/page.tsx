import { SubmittalDetailScreen } from "@/components/mobile/screens/SubmittalDetailScreen";

export default function SubmittalDetailPage({ params }: { params: { id: string } }) {
  return <SubmittalDetailScreen submittalId={params.id} />;
}
