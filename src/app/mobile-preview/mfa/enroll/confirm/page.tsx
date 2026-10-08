import { MfaTotpVerifyScreen } from "@/components/mobile/screens/MfaTotpVerifyScreen";

export default function MobileMfaEnrollConfirmPage() {
  return (
    <MfaTotpVerifyScreen
      purpose="enroll"
      title="Verify authenticator"
      description="Enter the 6-digit code from your authenticator app to complete setup."
      backHref="/mobile-preview/mfa/enroll/setup"
    />
  );
}
