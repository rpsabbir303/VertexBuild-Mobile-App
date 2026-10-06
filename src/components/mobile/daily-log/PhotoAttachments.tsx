"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import {
  compactThumbStatus,
  createFieldPhotoFromCapture,
  formatPhotoTimestamp,
  gpsStatusLine,
  isImageSrc,
  processPhotoUploadQueue,
  schedulePhotoUpload,
  uploadStatusLabel,
  type FieldPhoto,
  type PhotoParentContext,
} from "@/lib/mobile/photoEvidence";
import { IconCapture, IconClose, IconPlus, IconUpload } from "../icons";
import { PhotoEvidenceFlow } from "./PhotoEvidenceFlow";

type PendingPhoto = {
  key: string;
  previewUrl: string;
  status: "uploading" | "failed";
  file: File;
};

type SimplePhotoView = {
  key: string;
  src: string;
  label: string;
  status: "uploading" | "uploaded" | "saved_locally" | "failed";
  storedIndex?: number;
  pending?: PendingPhoto;
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read photo"));
    reader.readAsDataURL(file);
  });
}

function simpleSectionStatus(views: SimplePhotoView[], offline: boolean): string | null {
  if (views.length === 0) return null;
  if (views.some((item) => item.status === "uploading")) return "Uploading…";
  if (views.some((item) => item.status === "failed")) return "Upload failed";
  if (offline) return "Saved locally · Waiting to sync";
  return "Uploaded";
}

type SimpleProps = {
  mode?: "simple";
  photos: string[];
  onChange?: (photos: string[]) => void;
  locked?: boolean;
  addLabel?: string;
  hint?: string;
};

type EvidenceProps = {
  mode: "evidence";
  photos: FieldPhoto[];
  onChange?: (photos: FieldPhoto[]) => void;
  parentContext: PhotoParentContext;
  locked?: boolean;
  addLabel?: string;
  hint?: string;
};

export function PhotoAttachments(props: SimpleProps | EvidenceProps) {
  if (props.mode === "evidence") {
    return <PhotoEvidenceAttachments {...props} />;
  }
  return <SimplePhotoAttachments {...props} />;
}

function SimplePhotoAttachments({
  photos,
  onChange,
  locked = false,
  addLabel = "Add site photo",
  hint = "Show progress or field conditions",
}: SimpleProps) {
  const { isOffline } = useMobileApp();
  const markerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  photosRef.current = photos;

  useEffect(() => {
    const node = markerRef.current?.closest(".relative");
    if (node instanceof HTMLElement) setShell(node);
  }, []);

  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const stored: SimplePhotoView[] = photos.map((value, index) => ({
    key: `stored-${index}`,
    src: isImageSrc(value) ? value : "",
    label: isImageSrc(value) ? `Site photo ${index + 1}` : value,
    status: isOffline ? "saved_locally" : "uploaded",
    storedIndex: index,
  }));
  const waiting: SimplePhotoView[] = pending.map((item) => ({
    key: item.key,
    src: item.previewUrl,
    label: "Site photo",
    status: item.status,
    pending: item,
  }));
  const views = [...stored, ...waiting];
  const statusLine = simpleSectionStatus(views, isOffline);
  const preview = views.find((item) => item.key === previewKey) ?? null;

  async function ingest(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    const created: PendingPhoto[] = images.map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
      file,
    }));
    setPending((current) => [...current, ...created]);
    setSheetOpen(false);

    const saved: string[] = [];
    for (const item of created) {
      try {
        const dataUrl = await readFile(item.file);
        URL.revokeObjectURL(item.previewUrl);
        saved.push(dataUrl);
        setPending((current) => current.filter((entry) => entry.key !== item.key));
      } catch {
        setPending((current) =>
          current.map((entry) => (entry.key === item.key ? { ...entry, status: "failed" } : entry)),
        );
      }
    }
    if (saved.length > 0) onChange?.([...photosRef.current, ...saved]);
  }

  function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    void ingest(Array.from(list));
  }

  function removeStored(index: number) {
    onChange?.(photos.filter((_, itemIndex) => itemIndex !== index));
    setPreviewKey(null);
  }

  function removePending(key: string) {
    setPending((current) => {
      const found = current.find((item) => item.key === key);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return current.filter((item) => item.key !== key);
    });
    setPreviewKey(null);
  }

  async function retry(item: PendingPhoto) {
    setPending((current) =>
      current.map((entry) => (entry.key === item.key ? { ...entry, status: "uploading" } : entry)),
    );
    try {
      const dataUrl = await readFile(item.file);
      URL.revokeObjectURL(item.previewUrl);
      setPending((current) => current.filter((entry) => entry.key !== item.key));
      onChange?.([...photosRef.current, dataUrl]);
      setPreviewKey(null);
    } catch {
      setPending((current) =>
        current.map((entry) => (entry.key === item.key ? { ...entry, status: "failed" } : entry)),
      );
    }
  }

  const overlay =
    shell && (sheetOpen || preview)
      ? createPortal(
          <>
            {sheetOpen ? (
              <PhotoSheet
                onClose={() => setSheetOpen(false)}
                onTake={() => cameraRef.current?.click()}
                onLibrary={() => libraryRef.current?.click()}
              />
            ) : null}
            {preview ? (
              <SimplePhotoPreview
                view={preview}
                locked={locked}
                onClose={() => setPreviewKey(null)}
                onRemove={() => {
                  if (preview.pending) removePending(preview.pending.key);
                  else if (preview.storedIndex != null) removeStored(preview.storedIndex);
                }}
                onRetry={preview.pending?.status === "failed" ? () => void retry(preview.pending as PendingPhoto) : undefined}
              />
            ) : null}
          </>,
          shell,
        )
      : null;

  return (
    <div ref={markerRef}>
      <PhotoGridShell
        count={views.length}
        statusLine={statusLine}
        locked={locked}
        addLabel={addLabel}
        hint={hint}
        onOpenSheet={() => setSheetOpen(true)}
      >
        {views.map((item) => (
          <SimplePhotoThumb
            key={item.key}
            view={item}
            locked={locked}
            onOpen={() => setPreviewKey(item.key)}
            onRemove={() => {
              if (item.pending) removePending(item.pending.key);
              else if (item.storedIndex != null) removeStored(item.storedIndex);
            }}
          />
        ))}
      </PhotoGridShell>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {overlay}
    </div>
  );
}

function PhotoEvidenceAttachments({
  photos,
  onChange,
  parentContext,
  locked = false,
  addLabel = "Add site photo",
  hint = "Show progress or field conditions",
}: EvidenceProps) {
  const { isOffline } = useMobileApp();
  const markerRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  const uploadAttemptsRef = useRef<Map<string, number>>(new Map());
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [flow, setFlow] = useState<null | { kind: "camera" } | { kind: "library"; src: string }>(null);
  const [previewPhoto, setPreviewPhoto] = useState<FieldPhoto | null>(null);
  photosRef.current = photos;

  useEffect(() => {
    const node = markerRef.current?.closest(".relative");
    if (node instanceof HTMLElement) setShell(node);
  }, []);

  const patchPhoto = useCallback(
    (id: string, patch: Partial<FieldPhoto>) => {
      onChange?.(photosRef.current.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)));
    },
    [onChange],
  );

  const runUpload = useCallback(
    (photoId: string, fromRetry = false) => {
      if (isOffline) {
        patchPhoto(photoId, { uploadStatus: "queued" });
        return;
      }
      if (activeUploadsRef.current.has(photoId) && !fromRetry) return;

      const attempt = (uploadAttemptsRef.current.get(photoId) ?? 0) + 1;
      uploadAttemptsRef.current.set(photoId, attempt);
      activeUploadsRef.current.add(photoId);
      patchPhoto(photoId, { uploadStatus: "uploading" });

      schedulePhotoUpload(photoId, false, {
        onProgress: (id, status) => {
          patchPhoto(id, { uploadStatus: status });
          if (status === "uploaded" || status === "failed") {
            activeUploadsRef.current.delete(id);
          }
        },
        shouldFail: () => !fromRetry && attempt === 1,
      });
    },
    [isOffline, patchPhoto],
  );

  useEffect(() => {
    processPhotoUploadQueue(photos, isOffline, (id, status) => {
      patchPhoto(id, { uploadStatus: status });
      if (status === "queued") activeUploadsRef.current.delete(id);
    });
    if (!isOffline) {
      for (const photo of photos) {
        if (photo.uploadStatus === "queued" && !activeUploadsRef.current.has(photo.id)) {
          runUpload(photo.id);
        }
      }
    }
  }, [isOffline, photos, patchPhoto, runUpload]);

  function evidenceSectionStatus(): string | null {
    if (photos.length === 0) return null;
    if (photos.some((p) => p.uploadStatus === "uploading")) return "Uploading…";
    if (photos.some((p) => p.uploadStatus === "failed")) return "Upload failed";
    if (photos.some((p) => p.uploadStatus === "queued")) return "Saved locally · Queued for upload";
    if (isOffline) return "Saved locally";
    return null;
  }

  function attachFromFlow(src: string, meta: { capturedAt: string; gpsState: FieldPhoto["gpsState"]; locationLabel: string | null }) {
    const photo = createFieldPhotoFromCapture(src, meta, parentContext, isOffline);
    const next = [...photosRef.current, photo];
    onChange?.(next);
    setFlow(null);
    setSheetOpen(false);
    if (isOffline) return;
    window.setTimeout(() => runUpload(photo.id), 0);
  }

  async function onLibraryFiles(list: FileList | null) {
    const file = list?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await readFile(file);
    setSheetOpen(false);
    setFlow({ kind: "library", src: dataUrl });
  }

  function removePhoto(id: string) {
    onChange?.(photos.filter((photo) => photo.id !== id));
    setPreviewPhoto(null);
  }

  function retryUpload(photo: FieldPhoto) {
    activeUploadsRef.current.delete(photo.id);
    if (isOffline) {
      patchPhoto(photo.id, { uploadStatus: "queued" });
      return;
    }
    runUpload(photo.id, true);
  }

  const overlay =
    shell && (sheetOpen || flow || previewPhoto)
      ? createPortal(
          <>
            {sheetOpen ? (
              <PhotoSheet
                onClose={() => setSheetOpen(false)}
                onTake={() => {
                  setSheetOpen(false);
                  setFlow({ kind: "camera" });
                }}
                onLibrary={() => libraryRef.current?.click()}
              />
            ) : null}
            {flow?.kind === "camera" ? (
              <PhotoEvidenceFlow parentContext={parentContext} onCancel={() => setFlow(null)} onAttach={attachFromFlow} />
            ) : null}
            {flow?.kind === "library" ? (
              <PhotoEvidenceFlow
                parentContext={parentContext}
                initialSrc={flow.src}
                onCancel={() => setFlow(null)}
                onAttach={attachFromFlow}
              />
            ) : null}
            {previewPhoto ? (
              <EvidencePhotoPreview
                photo={previewPhoto}
                locked={locked}
                offline={isOffline}
                onClose={() => setPreviewPhoto(null)}
                onRemove={() => removePhoto(previewPhoto.id)}
                onRetry={
                  !locked && previewPhoto.uploadStatus === "failed" ? () => retryUpload(previewPhoto) : undefined
                }
              />
            ) : null}
          </>,
          shell,
        )
      : null;

  return (
    <div ref={markerRef}>
      <PhotoGridShell
        count={photos.length}
        statusLine={evidenceSectionStatus()}
        locked={locked}
        addLabel={addLabel}
        hint={hint}
        onOpenSheet={() => setSheetOpen(true)}
      >
        {photos.map((photo) => (
          <EvidencePhotoThumb
            key={photo.id}
            photo={photo}
            offline={isOffline}
            locked={locked}
            onOpen={() => setPreviewPhoto(photo)}
            onRemove={() => removePhoto(photo.id)}
            onRetry={photo.uploadStatus === "failed" && !locked ? () => retryUpload(photo) : undefined}
          />
        ))}
      </PhotoGridShell>
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void onLibraryFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {overlay}
    </div>
  );
}

function PhotoGridShell({
  count,
  statusLine,
  locked,
  addLabel,
  hint,
  onOpenSheet,
  children,
}: {
  count: number;
  statusLine: string | null;
  locked: boolean;
  addLabel: string;
  hint: string;
  onOpenSheet: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">
          {count > 0 ? `Photos · ${count}` : "Photos"}
        </p>
        {statusLine ? (
          <p className="text-[12px] font-medium text-brand-muted" role="status">
            {statusLine}
          </p>
        ) : null}
      </div>

      {count === 0 ? (
        locked ? (
          <p className="text-[13px] text-brand-muted">No photos</p>
        ) : (
          <button
            type="button"
            onClick={onOpenSheet}
            className="m-press flex min-h-[68px] w-full items-center gap-3 rounded-[14px] border border-brand-line/80 bg-white px-3 py-2.5 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-soft text-brand-navy">
              <IconPlus className="h-4 w-4 text-brand-blue" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold tracking-[-0.02em] text-brand-navy">{addLabel}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-brand-muted">{hint}</span>
            </span>
          </button>
        )
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {children}
          {!locked ? (
            <button
              type="button"
              onClick={onOpenSheet}
              className="m-press flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] border border-brand-line/80 bg-white text-brand-navy"
            >
              <IconPlus className="h-4 w-4 text-brand-blue" />
              <span className="text-[11px] font-semibold">Add</span>
            </button>
          ) : null}
        </div>
      )}
    </>
  );
}

function SimplePhotoThumb({
  view,
  locked,
  onOpen,
  onRemove,
}: {
  view: SimplePhotoView;
  locked: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const pendingLabel = view.status === "uploading" ? "Uploading…" : view.status === "failed" ? "Failed" : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className="m-press relative block aspect-square w-full overflow-hidden rounded-[12px] border border-brand-line/80 bg-brand-soft"
        aria-label={`View ${view.label}`}
      >
        {view.src ? (
          <img src={view.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center">
            <IconCapture className="h-4 w-4 text-brand-muted" />
            <span className="max-h-8 overflow-hidden text-[10px] font-medium leading-tight text-brand-muted">{view.label}</span>
          </span>
        )}
        {pendingLabel ? (
          <span className="absolute inset-x-0 bottom-0 bg-brand-navy/70 px-1 py-1 text-center text-[10px] font-semibold text-white">
            {pendingLabel}
          </span>
        ) : null}
      </button>
      {!locked ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${view.label}`}
          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy/80 text-white"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function EvidencePhotoThumb({
  photo,
  offline,
  locked,
  onOpen,
  onRemove,
  onRetry,
}: {
  photo: FieldPhoto;
  offline: boolean;
  locked: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const status = compactThumbStatus(photo, offline);
  const src = photo.src && isImageSrc(photo.src) ? photo.src : null;
  const label = photo.legacyLabel ?? "Site photo";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className="m-press relative block aspect-square w-full overflow-hidden rounded-[12px] border border-brand-line/80 bg-brand-soft"
        aria-label={`View ${label}`}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center">
            <IconCapture className="h-4 w-4 text-brand-muted" />
            <span className="max-h-8 overflow-hidden text-[10px] font-medium leading-tight text-brand-muted">{label}</span>
          </span>
        )}
        {status ? (
          <span className="absolute inset-x-0 bottom-0 bg-brand-navy/75 px-1 py-1 text-center text-[9px] font-semibold leading-tight text-white">
            {photo.uploadStatus === "queued" ? (
              <>
                Saved locally
                <br />
                Queued for upload
              </>
            ) : photo.uploadStatus === "failed" ? (
              <>
                Upload failed
                <br />
                Retry
              </>
            ) : (
              status
            )}
          </span>
        ) : null}
      </button>
      {!locked ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label}`}
          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy/80 text-white"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {onRetry && photo.uploadStatus === "failed" ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRetry();
          }}
          className="sr-only"
        >
          Retry upload
        </button>
      ) : null}
    </div>
  );
}

function PhotoSheet({
  onClose,
  onTake,
  onLibrary,
}: {
  onClose: () => void;
  onTake: () => void;
  onLibrary: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex items-end" role="presentation">
      <button type="button" className="absolute inset-0 bg-brand-ink/35" aria-label="Dismiss" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full rounded-t-[22px] border border-brand-line/70 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-sheet"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
        <h2 id={titleId} className="text-[16px] font-bold tracking-[-0.02em] text-brand-navy">
          Add photo
        </h2>
        <div className="mt-3 overflow-hidden rounded-[14px] border border-brand-line/80">
          <button
            type="button"
            onClick={onTake}
            className="m-press flex min-h-[56px] w-full items-center gap-3 border-b border-brand-line/70 px-3.5 text-left"
          >
            <IconCapture className="h-5 w-5 text-brand-navy" />
            <span className="text-[15px] font-semibold text-brand-navy">Take photo</span>
          </button>
          <button
            type="button"
            onClick={onLibrary}
            className="m-press flex min-h-[56px] w-full items-center gap-3 px-3.5 text-left"
          >
            <IconUpload className="h-5 w-5 text-brand-navy" />
            <span className="text-[15px] font-semibold text-brand-navy">Choose from library</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="m-press mt-2 flex h-12 w-full items-center justify-center rounded-[14px] text-[15px] font-semibold text-brand-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SimplePhotoPreview({
  view,
  locked,
  onClose,
  onRemove,
  onRetry,
}: {
  view: SimplePhotoView;
  locked: boolean;
  onClose: () => void;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-brand-ink/92" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <h2 id={titleId} className="text-[15px] font-semibold text-white">
          {view.label}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white"
        >
          <IconClose />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-4">
        {view.src ? (
          <img src={view.src} alt={view.label} className="max-h-full max-w-full rounded-[12px] object-contain" />
        ) : (
          <p className="text-[15px] font-medium text-white/80">{view.label}</p>
        )}
      </div>
      {!locked ? (
        <div className="flex items-center justify-end gap-2 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {onRetry ? (
            <button type="button" onClick={onRetry} className="h-11 px-3 text-[14px] font-semibold text-white">
              Retry
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="m-press h-11 rounded-full bg-white px-4 text-[14px] font-semibold text-brand-navy"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="pb-[max(16px,env(safe-area-inset-bottom))]" />
      )}
    </div>
  );
}

export function EvidencePhotoPreview({
  photo,
  locked,
  offline,
  onClose,
  onRemove,
  onRetry,
}: {
  photo: FieldPhoto;
  locked: boolean;
  offline: boolean;
  onClose: () => void;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const titleId = useId();
  const status = uploadStatusLabel(photo, offline);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-brand-ink/92" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <h2 id={titleId} className="text-[15px] font-semibold text-white">
          {photo.legacyLabel ?? "Field photo"}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close photo" className="flex h-10 w-10 items-center justify-center rounded-full text-white">
          <IconClose />
        </button>
      </div>
      {photo.parent ? (
        <div className="px-4 pb-2 text-[12px] text-white/70">
          <p>{photo.parent.projectName}</p>
          <p>
            {photo.parent.recordLabel} · {photo.parent.sectionLabel}
          </p>
          {status ? <p className="mt-1 font-semibold text-white/90">{status}</p> : null}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-4">
        {photo.src ? (
          <img src={photo.src} alt="" className="max-h-full max-w-full rounded-[12px] object-contain" />
        ) : (
          <p className="text-[15px] font-medium text-white/80">{photo.legacyLabel ?? "Photo"}</p>
        )}
      </div>
      <div className="px-4 pb-2 text-[12px] text-white/75">
        <p>{gpsStatusLine(photo)}</p>
        {photo.locationLabel ? <p>{photo.locationLabel}</p> : null}
        <p className="mt-1">{formatPhotoTimestamp(photo.capturedAt)}</p>
      </div>
      {!locked ? (
        <div className="flex items-center justify-end gap-2 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {onRetry ? (
            <button type="button" onClick={onRetry} className="h-11 px-3 text-[14px] font-semibold text-white">
              Retry
            </button>
          ) : null}
          <button type="button" onClick={onRemove} className="m-press h-11 rounded-full bg-white px-4 text-[14px] font-semibold text-brand-navy">
            Remove
          </button>
        </div>
      ) : (
        <div className="pb-[max(16px,env(safe-area-inset-bottom))]" />
      )}
    </div>
  );
}
