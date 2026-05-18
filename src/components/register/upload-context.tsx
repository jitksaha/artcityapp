import { createContext, useContext } from "react";
import type { UploadKind } from "@/lib/upload-constraints";

export type UploadStatus = {
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

export type UploadContextValue = {
  uploadKey: (kind: UploadKind, file: File, position?: number) => string;
  getStatus: (key: string) => UploadStatus | undefined;
  uploadOne: (args: {
    kind: UploadKind;
    bucket: "talent-media" | "talent-docs";
    file: File;
    position?: number;
  }) => Promise<void>;
};

export const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploads() {
  return useContext(UploadContext);
}