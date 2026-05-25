// lib/format.ts — Shared formatters for money, dates, and durations.
// All date formatters force en-US locale. All-caps slots are uppercased here.
// Used by Receipt, Home, and future screens.

/** Format cents as a dollar string: 14260 → "$142.60" */
export const fmtCents = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`;

/** Format dollars as a dollar string: 142.6 → "$142.60" */
export const fmtPrice = (dollars: number): string =>
  `$${dollars.toFixed(2)}`;

/**
 * Receipt date stamp: "22 · MAY · 2026 · 16:17 EDT"
 * IBM Plex Mono register — the ledger voice.
 */
export const fmtDateStamp = (iso: string): string => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const tz = d.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
  return `${day} \u00B7 ${month} \u00B7 ${year} \u00B7 ${hh}:${mm} ${tz}`;
};

/**
 * Duration in human-readable all-caps:
 *   30  → "30 MIN"
 *   60  → "1 HR"
 *   90  → "1 HR 30 MIN"
 *   260 → "4 HR 20 MIN"
 */
export const fmtDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} MIN`;
  if (m === 0) return `${h} HR`;
  return `${h} HR ${m} MIN`;
};

/** Day + date all-caps: "TUE 22 MAY 2026" */
export const fmtDayDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase().replace(/,/g, '');
};

/** Short date all-caps: "22 MAY 2026" */
export const fmtShortDate = (iso: string): string => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/** Compact receipt date for Home tease: "22 MAY" */
export const fmtReceiptDate = (iso: string): string => {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${day} ${month}`;
};

/** Dollars (NUMERIC from Supabase) → cents (integer) */
export const toCents = (dollars: number | null | undefined): number =>
  Math.round((dollars ?? 0) * 100);
