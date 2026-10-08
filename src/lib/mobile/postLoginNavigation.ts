import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { LoginSuccessResult } from "./auth";
import { MOBILE_AUTH_ROUTES } from "./authRoutes";

export function routeAfterPrimaryLogin(
  router: AppRouterInstance,
  result: LoginSuccessResult,
  onFullyAuthenticated: () => void,
) {
  if (result.mfaNext === "enroll") {
    router.replace(MOBILE_AUTH_ROUTES.mfaEnroll);
    return;
  }
  if (result.mfaNext === "challenge") {
    router.replace(MOBILE_AUTH_ROUTES.mfaChallenge);
    return;
  }
  onFullyAuthenticated();
}
