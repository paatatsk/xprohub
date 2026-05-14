// ============================================================
// XProHub — Cloudflare Worker: auto-release cron
// ============================================================
//
// Scheduled handler runs every 15 minutes. Queries Supabase for
// payments whose auto_release_at has expired (held, not disputed),
// then calls the release-payment Edge Function for each.
//
// This is the Worker Dignity backstop: workers get paid even if
// the customer never taps CONFIRM COMPLETION. The 72-hour timer
// set by mark_completed (E-1) expires, and this cron catches it.
//
// Design doc: docs/CHUNK_E_DESIGN.md — Auto-Release Mechanism
// ============================================================

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RELEASE_PAYMENT_SECRET: string;
}

interface OverduePayment {
  job_id: string;
}

interface ReleaseResult {
  job_id: string;
  success: boolean;
  error?: string;
}

export default {
  // ── Health check ─────────────────────────────────────────────
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },

  // ── Cron handler ─────────────────────────────────────────────
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[auto-release] Cron fired at ${new Date().toISOString()}`);

    const results: ReleaseResult[] = [];

    try {
      // Query Supabase PostgREST for overdue held payments
      const queryUrl =
        `${env.SUPABASE_URL}/rest/v1/payments` +
        `?escrow_status=eq.held` +
        `&auto_release_at=lte.now()` +
        `&disputed_at=is.null` +
        `&select=job_id`;

      const queryRes = await fetch(queryUrl, {
        headers: {
          "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!queryRes.ok) {
        const body = await queryRes.text();
        console.error(
          `[auto-release] Supabase query failed: ${queryRes.status} ${body}`
        );
        return;
      }

      const payments: OverduePayment[] = await queryRes.json();

      if (payments.length === 0) {
        console.log("[auto-release] No overdue payments found.");
        return;
      }

      console.log(`[auto-release] Found ${payments.length} overdue payment(s).`);

      // Call release-payment for each, continue on individual failures
      const releaseUrl = `${env.SUPABASE_URL}/functions/v1/release-payment`;

      for (const payment of payments) {
        try {
          const releaseRes = await fetch(releaseUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              "X-Service-Secret": env.RELEASE_PAYMENT_SECRET,
            },
            body: JSON.stringify({
              job_id: payment.job_id,
              mode: "auto_release",
            }),
          });

          const releaseBody = await releaseRes.json() as Record<string, unknown>;

          if (releaseRes.ok && releaseBody.success) {
            console.log(
              `[auto-release] Released job ${payment.job_id}` +
              (releaseBody.already_released ? " (already released)" : "")
            );
            results.push({ job_id: payment.job_id, success: true });
          } else {
            const errMsg = (releaseBody.error as string) ?? `HTTP ${releaseRes.status}`;
            console.error(
              `[auto-release] Failed job ${payment.job_id}: ${errMsg}`
            );
            results.push({ job_id: payment.job_id, success: false, error: errMsg });
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[auto-release] Exception for job ${payment.job_id}: ${errMsg}`
          );
          results.push({ job_id: payment.job_id, success: false, error: errMsg });
        }
      }

      // Summary
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      console.log(
        `[auto-release] Complete: ${succeeded} released, ${failed} failed, ` +
        `${payments.length} total.`
      );
    } catch (err) {
      console.error("[auto-release] Fatal error:", err);
    }
  },
};
