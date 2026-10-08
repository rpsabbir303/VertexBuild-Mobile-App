import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AuthAccount, LoginSuccessResult } from "./auth";
import { MOBILE_AUTH_ROUTES } from "./authRoutes";
import { routeAfterPrimaryLogin } from "./postLoginNavigation";
import { clearInvitationActivation, type FinalizeInvitationResult } from "./invitation";

type Deps = {
  finalize: () => Promise<FinalizeInvitationResult>;
  login: (email: string, password: string) => Promise<LoginSuccessResult | { ok: false }>;
  applyAuthAccount: (account: AuthAccount) => void;
  setCurrentProjectId: (id: string) => void;
  clearInvitation: () => void;
  router: AppRouterInstance;
  authenticated: boolean;
};

export async function completeInvitationActivationFlow(deps: Deps): Promise<
  | { ok: true }
  | { ok: false; code: string }
> {
  const result = await deps.finalize();
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  if (result.authorizedProjectIds.length === 0) {
    deps.router.replace(MOBILE_AUTH_ROUTES.inviteNoAccess);
    return { ok: true };
  }

  if (!deps.authenticated) {
    const signedIn = await deps.login(result.account.email, result.account.password);
    if (!signedIn.ok) {
      return { ok: false, code: "login_failed" };
    }
    deps.applyAuthAccount(signedIn.account);
    if (signedIn.mfaNext !== "none") {
      routeAfterPrimaryLogin(deps.router, signedIn, () => {});
      return { ok: true };
    }
  } else {
    deps.applyAuthAccount(result.account);
  }

  deps.setCurrentProjectId(result.authorizedProjectIds[0]);
  deps.clearInvitation();
  clearInvitationActivation();
  deps.router.replace(MOBILE_AUTH_ROUTES.appHome);
  return { ok: true };
}
