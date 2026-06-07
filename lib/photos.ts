// lib/photos.ts — Shared upload helper for the job photo system.
// All three stages (listing, before, after) use this function.
// Mirrors the proven avatar-upload pattern from profile-setup.tsx / id.tsx.

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
