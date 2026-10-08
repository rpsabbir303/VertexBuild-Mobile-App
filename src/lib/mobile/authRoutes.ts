export const MOBILE_AUTH_ROUTES = {
  biometric: "/mobile-preview/biometric",
  login: "/mobile-preview/login",
  forgotPassword: "/mobile-preview/forgot-password",
  verifyOtp: "/mobile-preview/forgot-password/verify",
  resetPassword: "/mobile-preview/reset-password",
  passwordUpdated: "/mobile-preview/password-updated",
  invite: "/mobile-preview/invite",
  inviteActivate: "/mobile-preview/invite/activate",
  inviteSetup: "/mobile-preview/invite/setup",
  inviteVerify: "/mobile-preview/invite/verify",
  inviteNoAccess: "/mobile-preview/invite/no-access",
  inviteComplete: "/mobile-preview/invite/complete",
  mfa: "/mobile-preview/mfa",
  mfaEnroll: "/mobile-preview/mfa/enroll",
  mfaEnrollSetup: "/mobile-preview/mfa/enroll/setup",
  mfaEnrollConfirm: "/mobile-preview/mfa/enroll/confirm",
  mfaChallenge: "/mobile-preview/mfa/challenge",
  sessionExpired: "/mobile-preview/session/expired",
  sessionRevoked: "/mobile-preview/session/revoked",
  sessionSuspended: "/mobile-preview/session/suspended",
  sessionPermission: "/mobile-preview/session/permission",
  offlineResume: "/mobile-preview/offline",
  offlineExpired: "/mobile-preview/offline/expired",
  sso: "/mobile-preview/sso",
  ssoAuthorize: "/mobile-preview/sso/authorize",
  ssoCallback: "/mobile-preview/sso/callback",
  ssoResult: "/mobile-preview/sso/result",
  appHome: "/mobile-preview",
} as const;

export function loginWithInvitationContinue(): string {
  return `${MOBILE_AUTH_ROUTES.login}?continue=invitation`;
}

/** @deprecated Email-link success screen replaced by OTP verify route */
export const MOBILE_AUTH_ROUTES_LEGACY = {
  forgotPasswordSent: "/mobile-preview/forgot-password/sent",
} as const;

export function isMobileAuthPath(pathname: string): boolean {
  return (
    pathname === MOBILE_AUTH_ROUTES.biometric ||
    pathname === MOBILE_AUTH_ROUTES.login ||
    pathname === MOBILE_AUTH_ROUTES.forgotPassword ||
    pathname === MOBILE_AUTH_ROUTES.verifyOtp ||
    pathname === MOBILE_AUTH_ROUTES.resetPassword ||
    pathname === MOBILE_AUTH_ROUTES.passwordUpdated ||
    pathname === MOBILE_AUTH_ROUTES.invite ||
    pathname === MOBILE_AUTH_ROUTES.inviteActivate ||
    pathname === MOBILE_AUTH_ROUTES.inviteSetup ||
    pathname === MOBILE_AUTH_ROUTES.inviteVerify ||
    pathname === MOBILE_AUTH_ROUTES.inviteNoAccess ||
    pathname === MOBILE_AUTH_ROUTES.inviteComplete ||
    pathname === MOBILE_AUTH_ROUTES.mfa ||
    pathname === MOBILE_AUTH_ROUTES.mfaEnroll ||
    pathname === MOBILE_AUTH_ROUTES.mfaEnrollSetup ||
    pathname === MOBILE_AUTH_ROUTES.mfaEnrollConfirm ||
    pathname === MOBILE_AUTH_ROUTES.mfaChallenge ||
    pathname === MOBILE_AUTH_ROUTES_LEGACY.forgotPasswordSent ||
    pathname.startsWith(`${MOBILE_AUTH_ROUTES.mfa}/`) ||
    pathname.startsWith(`${MOBILE_AUTH_ROUTES.forgotPassword}/`) ||
    pathname.startsWith(`${MOBILE_AUTH_ROUTES.invite}/`) ||
    pathname.startsWith("/mobile-preview/session/") ||
    pathname.startsWith("/mobile-preview/offline") ||
    pathname.startsWith("/mobile-preview/sso")
  );
}
