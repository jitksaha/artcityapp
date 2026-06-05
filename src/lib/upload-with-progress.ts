import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface UploadProgressOptions {
  bucket: string;
  path: string;
  file: Blob | File;
  contentType?: string;
  upsert?: boolean;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}

/**
 * Uploads a file to Supabase Storage via XHR so we can report progress.
 * Mirrors `supabase.storage.from(bucket).upload(path, file, { upsert })`.
 */
export async function uploadWithProgress(opts: UploadProgressOptions): Promise<void> {
  const { bucket, path, file, upsert = true, signal, onProgress, contentType } = opts;

  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_KEY);
    xhr.setRequestHeader("x-upsert", upsert ? "true" : "false");
    xhr.setRequestHeader("cache-control", "3600");
    const ct = contentType || (file as Blob).type;
    if (ct) xhr.setRequestHeader("content-type", ct);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) msg = body.message;
        } catch {
          if (xhr.responseText) msg = xhr.responseText.slice(0, 200);
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
    }
    xhr.send(file);
  });
}
