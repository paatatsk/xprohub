// types/receipt.ts — TypeScript shape of the data <ReceiptScreen /> consumes.
// Sole source of truth for both customer and worker views.
//
// Money is always cents (integer). Formatting happens in the view.
// Dates are always ISO 8601 strings. Formatting happens in the view.

export type ReceiptViewerRole = 'customer' | 'worker';

export type Currency = 'usd';

export type EndorsementStatus =
  | 'none'                  // no action yet
  | 'endorsed'              // customer pressed ENDORSE
  | 'concern_raised'        // customer pressed RAISE A CONCERN
  | 'concern_resolved';     // moderation closed the concern

export interface ReceiptPhoto {
  url: string;              // CDN URL of the uploaded after-photo
  capturedAt: string;       // ISO 8601 — when worker took the photo
  caption?: string;         // optional, rarely populated
}

export interface ReceiptLineItem {
  label: string;            // "Bathroom deep clean"
  amountCents: number;      // 5000
  description?: string;     // optional, "Astoria → Brooklyn"
}

export interface ReceiptTrace {
  jobId: string;            // "job_0a82f4c1"
  stripeChargeId: string | null;
  paidAt: string;           // ISO 8601
  payoutAvailableAt: string;// ISO 8601 — may be in the future
  payoutCompleted: boolean;
  currency: Currency;
}

export interface ReceiptParty {
  id: string;
  fullName: string;         // "Maria Reyes"
  firstName: string;        // "Maria"
  location: string;         // "Astoria" or "Brooklyn"
}

export interface ReceiptData {
  // Identity
  jobId: string;
  viewerRole: ReceiptViewerRole;

  // People
  worker: ReceiptParty;
  customer: ReceiptParty;

  // Job description
  actionDescription: string;  // "cleaned your 2-bedroom apartment"
                              //   — phrased from the customer's POV.
                              //   Worker view rewrites this client-side.
  durationMinutes: number;    // 260
  completedAt: string;        // ISO 8601

  // Evidence
  photos: ReceiptPhoto[];     // [] is valid — see empty state in spec

  // Money — all in cents, all integers
  lineItems: ReceiptLineItem[];
  subtotalCents: number;
  platformFeePercent: number; // 8 (whole-number percent for display)
  platformFeeCents: number;   // 1240
  workerPayoutCents: number;  // 14260  ← the hero number
  customerChargedCents: number; // 15500
  currency: Currency;

  // Voice
  workerNote: string | null;  // single short paragraph, may be null

  // Transaction
  trace: ReceiptTrace;

  // Endorsement
  endorsement: EndorsementStatus;
  endorsedAt?: string;        // ISO 8601 — set when endorsement === 'endorsed'
}
