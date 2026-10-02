import { NotificationDeepLinkScreen } from "@/components/mobile/screens/NotificationDeepLinkScreen";

export default function NotificationDeepLinkPage({
  params,
}: {
  params: { id: string };
}) {
  return <NotificationDeepLinkScreen notificationId={params.id} />;
}
