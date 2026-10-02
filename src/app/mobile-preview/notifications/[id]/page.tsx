import { NotificationDetailScreen } from "@/components/mobile/screens/NotificationDetailScreen";

export default function MobileNotificationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <NotificationDetailScreen notificationId={params.id} />;
}
