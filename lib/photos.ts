// lib/photos.ts — Shared upload helpers for the XProHub photo system.
// Job photos (listing, before, after) and worker portfolio photos.

import { supabase } from './supabase';

export type PhotoType = 'listing' | 'before' | 'after';

/**
 * Upload a job photo to Supabase Storage and return the public URL.
 *
 * Path convention: {jobId}/{photoType}_{timestamp}.{ext}
 * Each photo is a distinct file (no upsert — unlike avatars which overwrite).
 *
 * @param jobId    - The job UUID this photo belongs to
 * @param photoType - 'listing' | 'before' | 'after'
 * @param imageUri - Local file URI from expo-image-picker
 * @returns { url, path } on success, throws on failure
 */
export async function uploadJobPhoto(
  jobId: string,
  photoType: PhotoType,
  imageUri: string,
): Promise<{ url: string; path: string }> {
  const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const timestamp = Date.now();
  const path = `${jobId}/${photoType}_${timestamp}.${ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: `${photoType}_${timestamp}.${ext}`,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as any);

  const { error } = await supabase.storage
    .from('job-photos')
    .upload(path, formData);

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('job-photos')
    .getPublicUrl(path);

  return { url: urlData.publicUrl, path };
}

/**
 * Upload a worker portfolio photo to Supabase Storage and return the public URL.
 *
 * Path convention: {userId}/portfolio_{timestamp}.{ext}
 * Free aspect ratio — portfolio work is best shown as-shot, not cropped.
 *
 * @param userId   - The worker's UUID
 * @param imageUri - Local file URI from expo-image-picker
 * @returns { url, path } on success, throws on failure
 */
export async function uploadPortfolioPhoto(
  userId: string,
  imageUri: string,
): Promise<{ url: string; path: string }> {
  const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const timestamp = Date.now();
  const path = `${userId}/portfolio_${timestamp}.${ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: `portfolio_${timestamp}.${ext}`,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as any);

  const { error } = await supabase.storage
    .from('worker-portfolio')
    .upload(path, formData);

  if (error) {
    throw new Error(`Portfolio upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('worker-portfolio')
    .getPublicUrl(path);

  return { url: urlData.publicUrl, path };
}
