import { RfiDetailScreen } from "@/components/mobile/screens/RfiDetailScreen";

export default function RfiDetailPage({ params }: { params: { id: string } }) {
  return <RfiDetailScreen rfiId={params.id} />;
}
