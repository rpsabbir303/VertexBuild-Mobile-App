export const MOBILE_AUTH_ROUTES = {
  biometric: "/mobile-preview/biometric",
  login: "/mobile-preview/login",
  forgotPassword: "/mobile-preview/forgot-password",
  verifyOtp: "/mobile-preview/forgot-password/verify",
  resetPassword: "/mobile-preview/reset-password",
  passwordUpdated: "/mobile-preview/password-updated",
  appHome: "/mobile-preview",
} as const;

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
    pathname === MOBILE_AUTH_ROUTES_LEGACY.forgotPasswordSent ||
    pathname.startsWith(`${MOBILE_AUTH_ROUTES.forgotPassword}/`)
  );
}
