import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Formative assessment storage bucket names
 */
export const FORMATIVE_BUCKETS = {
  ARTIFACTS: "formative-artifacts",
  AUDIO: "formative-audio",
  STUDYLAB_IMAGES: "studylab-images",
  STUDYLAB_RECORDINGS: "student-recordings",
} as const;

/**
 * Signed URL expiration times (in seconds)
 */
export const SIGNED_URL_EXPIRY = {
  DOWNLOAD: 60 * 60, // 1 hour for viewing
  UPLOAD: 60 * 5, // 5 minutes for uploading
} as const;

/**
 * Generate a unique storage path for a formative artifact
 */
export function generateFormativeArtifactPath(
  activityId: string,
  studentId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const extension = filename.split(".").pop() || "file";
  return `${activityId}/${studentId}/${timestamp}.${extension}`;
}

/**
 * Generate a unique storage path for formative audio
 */
export function generateFormativeAudioPath(
  activityId: string,
  studentId: string
): string {
  const timestamp = Date.now();
  return `${activityId}/${studentId}/${timestamp}.webm`;
}

/**
 * Upload a file to a formative storage bucket
 * Returns the storage path on success
 */
export async function uploadFormativeFile(
  bucket: keyof typeof FORMATIVE_BUCKETS,
  path: string,
  file: File | Blob,
  contentType?: string
): Promise<{ path: string; error: Error | null }> {
  const supabase = createSupabaseAdminClient();
  const bucketName = FORMATIVE_BUCKETS[bucket];

  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    contentType: contentType || file.type,
    upsert: false,
  });

  if (error) {
    return { path: "", error: new Error(error.message) };
  }

  return { path, error: null };
}

/**
 * Get a signed URL for downloading/viewing a formative file
 */
export async function getFormativeSignedUrl(
  bucket: keyof typeof FORMATIVE_BUCKETS,
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRY.DOWNLOAD
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createSupabaseAdminClient();
  const bucketName = FORMATIVE_BUCKETS[bucket];

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { url: null, error: new Error(error.message) };
  }

  return { url: data.signedUrl, error: null };
}

/**
 * Get a signed upload URL for a formative file
 */
export async function getFormativeUploadUrl(
  bucket: keyof typeof FORMATIVE_BUCKETS,
  path: string
): Promise<{ url: string | null; token: string | null; error: Error | null }> {
  const supabase = createSupabaseAdminClient();
  const bucketName = FORMATIVE_BUCKETS[bucket];

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(path);

  if (error) {
    return { url: null, token: null, error: new Error(error.message) };
  }

  return { url: data.signedUrl, token: data.token, error: null };
}

/**
 * Delete a formative file from storage
 */
export async function deleteFormativeFile(
  bucket: keyof typeof FORMATIVE_BUCKETS,
  path: string
): Promise<{ error: Error | null }> {
  const supabase = createSupabaseAdminClient();
  const bucketName = FORMATIVE_BUCKETS[bucket];

  const { error } = await supabase.storage.from(bucketName).remove([path]);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Get public URL (if bucket is public) - typically not used for formative files
 */
export function getFormativePublicUrl(
  bucket: keyof typeof FORMATIVE_BUCKETS,
  path: string
): string {
  const supabase = createSupabaseAdminClient();
  const bucketName = FORMATIVE_BUCKETS[bucket];

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}
