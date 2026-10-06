export type PhotoUploadStatus = "uploading" | "uploaded" | "queued" | "failed";

export type GpsState = "captured" | "unavailable" | "denied";

export type PhotoParentContext = {
  projectId: string;
  projectName: string;
  recordLabel: string;
  sectionLabel: string;
  dailyLogId?: string;
  workEntryId?: string;
};

export type FieldPhoto = {
  id: string;
  src: string;
  capturedAt: string;
  locationLabel: string | null;
  gpsState: GpsState;
  uploadStatus: PhotoUploadStatus;
  legacyLabel?: string;
  parent?: PhotoParentContext;
};

const UPLOAD_MS = 1400;

let uploadTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function newPhotoId(): string {
  return `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isImageSrc(value: string) {
  return value.startsWith("data:image") || value.startsWith("blob:");
}

export function isFieldPhoto(value: unknown): value is FieldPhoto {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "src" in value &&
    "uploadStatus" in value &&
    "capturedAt" in value
  );
}

export function formatPhotoTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function gpsStatusLine(photo: Pick<FieldPhoto, "gpsState" | "locationLabel">): string {
  if (photo.gpsState === "captured") return "GPS captured";
  if (photo.gpsState === "denied") return "Location permission denied";
  return "Location unavailable";
}

export function uploadStatusLabel(photo: FieldPhoto, offline: boolean): string | null {
  if (photo.uploadStatus === "uploading") return "Uploading…";
  if (photo.uploadStatus === "uploaded") return "Uploaded";
  if (photo.uploadStatus === "failed") return "Upload failed";
  if (photo.uploadStatus === "queued") return "Saved locally · Queued for upload";
  if (offline) return "Saved locally";
  return null;
}

export function normalizeFieldPhoto(value: string | FieldPhoto, parent?: PhotoParentContext): FieldPhoto {
  if (isFieldPhoto(value)) {
    return { ...value, parent: value.parent ?? parent };
  }
  if (isImageSrc(value)) {
    return {
      id: newPhotoId(),
      src: value,
      capturedAt: new Date().toISOString(),
      locationLabel: null,
      gpsState: "unavailable",
      uploadStatus: "uploaded",
      parent,
    };
  }
  return {
    id: newPhotoId(),
    src: "",
    capturedAt: new Date().toISOString(),
    locationLabel: null,
    gpsState: "unavailable",
    uploadStatus: "uploaded",
    legacyLabel: value,
    parent,
  };
}

export function normalizeWorkPhotos(values: (string | FieldPhoto)[], parent?: PhotoParentContext): FieldPhoto[] {
  return values.map((item) => normalizeFieldPhoto(item, parent));
}

export function photoThumbSrc(photo: string | FieldPhoto): string | null {
  if (typeof photo === "string") return isImageSrc(photo) ? photo : null;
  return photo.src && isImageSrc(photo.src) ? photo.src : null;
}

export function compactThumbStatus(photo: FieldPhoto, offline: boolean): string | null {
  if (photo.uploadStatus === "uploading") return "Uploading…";
  if (photo.uploadStatus === "failed") return "Upload failed";
  if (photo.uploadStatus === "queued") return "Saved locally";
  if (offline && photo.uploadStatus === "uploaded") return "Uploaded";
  if (photo.uploadStatus === "uploaded") return "Uploaded";
  return null;
}

export async function captureGps(): Promise<{ gpsState: GpsState; locationLabel: string | null }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { gpsState: "unavailable", locationLabel: null };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          gpsState: "captured",
          locationLabel: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }),
      (err) =>
        resolve({
          gpsState: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
          locationLabel: null,
        }),
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 },
    );
  });
}

export function createFieldPhotoFromCapture(
  src: string,
  meta: { capturedAt: string; gpsState: GpsState; locationLabel: string | null },
  parent: PhotoParentContext,
  offline: boolean,
): FieldPhoto {
  return {
    id: newPhotoId(),
    src,
    capturedAt: meta.capturedAt,
    locationLabel: meta.locationLabel,
    gpsState: meta.gpsState,
    uploadStatus: offline ? "queued" : "uploading",
    parent,
  };
}

type UploadCallbacks = {
  onProgress: (id: string, status: PhotoUploadStatus) => void;
  shouldFail?: (id: string) => boolean;
};

export function schedulePhotoUpload(photoId: string, offline: boolean, callbacks: UploadCallbacks) {
  const existing = uploadTimers.get(photoId);
  if (existing) clearTimeout(existing);

  if (offline) {
    callbacks.onProgress(photoId, "queued");
    return;
  }

  callbacks.onProgress(photoId, "uploading");
  const timer = setTimeout(() => {
    uploadTimers.delete(photoId);
    if (callbacks.shouldFail?.(photoId)) {
      callbacks.onProgress(photoId, "failed");
      return;
    }
    callbacks.onProgress(photoId, "uploaded");
  }, UPLOAD_MS);
  uploadTimers.set(photoId, timer);
}

export function cancelPhotoUpload(photoId: string) {
  const existing = uploadTimers.get(photoId);
  if (existing) clearTimeout(existing);
  uploadTimers.delete(photoId);
}

export function processPhotoUploadQueue(
  photos: FieldPhoto[],
  offline: boolean,
  onUpdate: (id: string, status: PhotoUploadStatus) => void,
) {
  for (const photo of photos) {
    if (photo.uploadStatus === "queued" && !offline) {
      schedulePhotoUpload(photo.id, false, { onProgress: onUpdate });
    }
    if (photo.uploadStatus === "uploading" && offline) {
      cancelPhotoUpload(photo.id);
      onUpdate(photo.id, "queued");
    }
  }
}
