/**
 * Content moderation helpers.
 *
 * Server enforcement lives in check_content() (plpgsql) and BEFORE INSERT
 * triggers. This module provides the client-side companion:
 *   - friendlyError(): maps server RAISE EXCEPTION messages to user-facing
 *     copy, filtering out raw Postgres errors that should never reach a user.
 *
 * Future home for client-side wordlist cache + validators (Slices 4-5).
 */

// ── Known friendly messages from server RAISE EXCEPTION ───────
// These are the exact strings returned by check_content(), the
// create_job_with_tasks() moderation block, and the bid/message
// triggers. If the server error message starts with one of these,
// it's safe to show the user verbatim.
const FRIENDLY_PREFIXES = [
  // Profanity (check_content)
  'Please use respectful language',
  "Let's keep it professional",
  // Min-length (create_job_with_tasks)
  'Please give your job a slightly longer title',
  'Add a bit more detail',
  // Rate-limit (create_job_with_tasks + bid trigger)
  "You're posting a lot of jobs quickly",
  "You're applying very quickly",
];

/**
 * Given a Supabase error from an RPC or insert, return a user-facing
 * message. Known moderation messages pass through as-is; everything
 * else (FK violations, network errors, unexpected DB errors) gets a
 * safe generic fallback.
 *
 * @param error  The error object from Supabase ({ message?: string })
 * @param fallback  Generic message for non-moderation errors
 */
export function friendlyError(
  error: { message?: string } | null,
  fallback: string,
): string {
  const msg = error?.message;
  if (!msg) return fallback;

  for (const prefix of FRIENDLY_PREFIXES) {
    if (msg.startsWith(prefix)) return msg;
  }

  return fallback;
}
