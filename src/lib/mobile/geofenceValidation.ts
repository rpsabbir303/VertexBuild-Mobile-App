/** Demo geofence validation — device location + mock backend; not production site boundaries. */

import type { GeofenceStatus } from "./timeTracking";

export const GEOFENCE_OUTSIDE_DEMO_EMAIL = "geofence-outside@summitconstruction.com";
export const GEOFENCE_FAIL_DEMO_EMAIL = "geofence-fail@summitconstruction.com";

export type GeolocationPermissionState = "unsupported" | "prompt" | "granted" | "denied" | "unknown";

export type GeofenceValidationIssue =
  | "permission_denied"
  | "location_unavailable"
  | "location_timeout"
  | "services_unavailable"
  | "backend_failed"
  | "outside_geofence";

export type GeofenceValidationStep =
  | "idle"
  | "checking_permission"
  | "checking_location"
  | "validating_geofence"
  | "complete";

export type GeofenceValidationResult =
  | {
      ok: true;
      geofenceStatus: Extract<GeofenceStatus, "on_site">;
      step: "complete";
      message: string;
      issue: null;
    }
  | {
      ok: false;
      geofenceStatus: Extract<GeofenceStatus, "outside" | "unavailable">;
      step: "complete";
      message: string;
      issue: GeofenceValidationIssue;
    };

const BACKEND_MS = 520;
const LOCATION_TIMEOUT_MS = 10000;

export function geofenceIssueGuidance(issue: GeofenceValidationIssue): string {
  switch (issue) {
    case "permission_denied":
      return "Allow location access for this site in your browser or device settings, then tap Check again.";
    case "location_timeout":
      return "Move to an open area with a clearer GPS signal and try again.";
    case "location_unavailable":
      return "Turn on location services and ensure the browser can access your position.";
    case "services_unavailable":
      return "This preview requires a browser with geolocation support.";
    case "backend_failed":
      return "The validation service did not respond. Check your connection and retry.";
    case "outside_geofence":
      return "Move inside the job site boundary, then recheck your location.";
    default:
      return "Try the check again when you are ready.";
  }
}

export async function queryGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }
  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "unknown";
    const status = await permissions.query({ name: "geolocation" });
    if (status.state === "granted") return "granted";
    if (status.state === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

type DeviceLocationResult =
  | { ok: true }
  | { ok: false; issue: Exclude<GeofenceValidationIssue, "outside_geofence" | "backend_failed"> };

async function acquireDeviceLocation(): Promise<DeviceLocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, issue: "services_unavailable" };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve({ ok: true }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, issue: "permission_denied" });
          return;
        }
        if (err.code === err.TIMEOUT) {
          resolve({ ok: false, issue: "location_timeout" });
          return;
        }
        resolve({ ok: false, issue: "location_unavailable" });
      },
      { timeout: LOCATION_TIMEOUT_MS, enableHighAccuracy: true, maximumAge: 0 },
    );
  });
}

/** Mock backend — authoritative in demo; does not use coordinates or invented radii. */
async function mockBackendGeofenceValidate(
  projectId: string,
  reporterEmail: string,
): Promise<{ ok: true; status: "on_site" } | { ok: false; status: "outside" | "failed" }> {
  void projectId;
  await new Promise((r) => setTimeout(r, BACKEND_MS));

  const email = reporterEmail.toLowerCase();
  if (email === GEOFENCE_FAIL_DEMO_EMAIL) {
    return { ok: false, status: "failed" };
  }
  if (email === GEOFENCE_OUTSIDE_DEMO_EMAIL) {
    return { ok: false, status: "outside" };
  }
  return { ok: true, status: "on_site" };
}

export type RunGeofenceValidationInput = {
  projectId: string;
  projectName: string;
  reporterEmail: string;
  onStep?: (step: GeofenceValidationStep) => void;
};

export async function runGeofenceValidation(
  input: RunGeofenceValidationInput,
): Promise<GeofenceValidationResult> {
  input.onStep?.("checking_location");
  const location = await acquireDeviceLocation();

  if (!location.ok) {
    const message =
      location.issue === "permission_denied"
        ? "Location permission is required to validate the job site geofence."
        : location.issue === "location_timeout"
          ? "Could not get a GPS fix in time."
          : location.issue === "services_unavailable"
            ? "Geolocation is not available in this environment."
            : "Current location is unavailable.";
    return {
      ok: false,
      geofenceStatus: "unavailable",
      step: "complete",
      message,
      issue: location.issue,
    };
  }

  input.onStep?.("validating_geofence");
  const backend = await mockBackendGeofenceValidate(input.projectId, input.reporterEmail);

  if (!backend.ok && backend.status === "failed") {
    return {
      ok: false,
      geofenceStatus: "unavailable",
      step: "complete",
      message: "Geofence validation could not be completed.",
      issue: "backend_failed",
    };
  }

  if (!backend.ok && backend.status === "outside") {
    return {
      ok: false,
      geofenceStatus: "outside",
      step: "complete",
      message: "You appear outside the job site geofence for this project.",
      issue: "outside_geofence",
    };
  }

  return {
    ok: true,
    geofenceStatus: "on_site",
    step: "complete",
    message: "Location validated for this project.",
    issue: null,
  };
}

/** UI mode for out-of-geofence — never treat unavailable as outside. */
export type OutOfGeofenceViewMode = "outside" | "location_problem" | "on_site";

export function resolveOutOfGeofenceViewMode(
  geofence: GeofenceStatus,
  lastResult: GeofenceValidationResult | null,
): OutOfGeofenceViewMode {
  if (lastResult?.ok) return "on_site";
  if (lastResult && !lastResult.ok) {
    return lastResult.issue === "outside_geofence" ? "outside" : "location_problem";
  }
  if (geofence === "outside") return "outside";
  if (geofence === "on_site") return "on_site";
  return "location_problem";
}

export function outOfGeofenceHeadline(mode: OutOfGeofenceViewMode): string {
  switch (mode) {
    case "outside":
      return "Outside project geofence";
    case "on_site":
      return "On site";
    default:
      return "Location not verified";
  }
}
