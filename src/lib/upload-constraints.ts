// Shared upload rules used by both client validation and the
// recordMediaUpload server function. Keep this file client-safe.

export type UploadKind =
  | "headshot"
  | "full_body"
  | "medium_shot"
  | "voice_reel"
  | "cv"
  | "driving_license";

export type UploadBucket = "talent-media" | "talent-docs";

export interface UploadRule {
  bucket: UploadBucket;
  maxBytes: number;
  mimes: RegExp;
  label: string;
  /** Plain-language description shown in errors / hints. */
  accept: string;
  required?: boolean;
}

const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  headshot: {
    bucket: "talent-media",
    maxBytes: 5 * MB,
    mimes: /^image\/(jpeg|png|webp)$/,
    label: "Headshot",
    accept: "JPG, PNG or WEBP up to 5MB",
    required: true,
  },
  full_body: {
    bucket: "talent-media",
    maxBytes: 5 * MB,
    mimes: /^image\/(jpeg|png|webp)$/,
    label: "Full-body photo",
    accept: "JPG, PNG or WEBP up to 5MB",
    required: true,
  },
  medium_shot: {
    bucket: "talent-media",
    maxBytes: 5 * MB,
    mimes: /^image\/(jpeg|png|webp)$/,
    label: "Medium shot",
    accept: "JPG, PNG or WEBP up to 5MB",
  },
  voice_reel: {
    bucket: "talent-media",
    maxBytes: 15 * MB,
    mimes: /^audio\/(mpeg|mp3|wav|x-wav|wave|x-m4a|mp4|aac|ogg|webm)$/,
    label: "Voice reel",
    accept: "MP3, WAV or M4A up to 15MB",
  },
  cv: {
    bucket: "talent-docs",
    maxBytes: 5 * MB,
    mimes:
      /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
    label: "CV / Resume",
    accept: "PDF or DOC/DOCX up to 5MB",
  },
  driving_license: {
    bucket: "talent-docs",
    maxBytes: 5 * MB,
    mimes:
      /^(application\/pdf|image\/(jpeg|png|webp))$/,
    label: "Driving license",
    accept: "PDF, JPG, PNG or WEBP up to 5MB",
  },
};

export function formatBytes(n: number): string {
  if (n >= MB) return `${(n / MB).toFixed(1)}MB`;
  if (n >= 1024) return `${Math.round(n / 1024)}KB`;
  return `${n}B`;
}

/** Returns a clear error message, or null if the file passes. */
export function validateUpload(
  kind: UploadKind,
  file: { type?: string | null; size?: number | null; name?: string | null },
): string | null {
  const rule = UPLOAD_RULES[kind];
  if (!rule) return `Unknown upload type: ${kind}`;
  const type = file.type ?? "";
  const size = file.size ?? 0;
  if (!type || !rule.mimes.test(type)) {
    return `${rule.label}: unsupported file type "${type || "unknown"}". Allowed: ${rule.accept}.`;
  }
  if (size <= 0) return `${rule.label}: file is empty.`;
  if (size > rule.maxBytes) {
    return `${rule.label}: ${formatBytes(size)} exceeds the ${formatBytes(rule.maxBytes)} limit.`;
  }
  return null;
}
