import { redirect } from "next/navigation";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";

export default function MobileForgotPasswordSentRedirect() {
  redirect(MOBILE_AUTH_ROUTES.verifyOtp);
}
