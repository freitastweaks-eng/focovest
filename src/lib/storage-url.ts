import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const COMMUNITY_FILES_BUCKET = "community-files";
export const GROUP_FILES_BUCKET = "group-files";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateSharedUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo maximo: 10 MB");
  }

  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error("Tipo de arquivo nao permitido. Use imagem ou PDF.");
  }
}

export function safeUploadFileName(file: File) {
  const base =
    file.name
      .replace(/\.[^.]+$/, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "arquivo";
  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  return `${Date.now()}-${crypto.randomUUID()}.${base}.${ext}`;
}

/**
 * Extracts the storage object path from either a stored path or a legacy
 * public URL. Returns null when there's nothing to resolve.
 */
export function extractCommunityPath(value: string | null | undefined): string | null {
  return extractStoragePath(COMMUNITY_FILES_BUCKET, value);
}

export function extractStoragePath(
  bucket: string,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  // Already a relative path
  if (!/^https?:\/\//i.test(value)) return value;
  // Legacy public URL: .../storage/v1/object/public/community-files/<path>
  const marker = `/${bucket}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return null;
  return value.slice(idx + marker.length);
}

/**
 * React hook returning a short-lived signed URL for a community-files object.
 * Accepts either a stored path or a legacy public URL.
 */
export function useCommunityFileUrl(value: string | null | undefined): string | null {
  return useStorageFileUrl(COMMUNITY_FILES_BUCKET, value);
}

export function useGroupFileUrl(value: string | null | undefined): string | null {
  return useStorageFileUrl(GROUP_FILES_BUCKET, value);
}

export function useStorageFileUrl(bucket: string, value: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const path = extractStoragePath(bucket, value);
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [bucket, value]);
  return url;
}
