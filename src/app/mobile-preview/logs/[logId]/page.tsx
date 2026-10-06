import { DailyLogOpenScreen } from "@/components/mobile/screens/DailyLogOpenScreen";

export default function DailyLogOpenPage({ params }: { params: { logId: string } }) {
  return <DailyLogOpenScreen logId={params.logId} />;
}
