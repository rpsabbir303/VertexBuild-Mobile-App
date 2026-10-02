import { MobileToolScreen } from "@/components/mobile/screens/MobileToolScreen";

export default function MobileToolPage({ params }: { params: { slug: string } }) {
  return <MobileToolScreen slug={params.slug} />;
}
