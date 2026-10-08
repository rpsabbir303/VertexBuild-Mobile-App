import { MfaTotpVerifyScreen } from "@/components/mobile/screens/MfaTotpVerifyScreen";

export default function MobileMfaChallengePage() {
  return (
    <MfaTotpVerifyScreen
      purpose="challenge"
      title="Authenticator code"
      description="Enter the 6-digit code from your authenticator app to continue."
    />
  );
}
