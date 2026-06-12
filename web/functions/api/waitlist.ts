/**
 * XProHub — Waitlist signup endpoint
 * Cloudflare Pages Function: POST /api/waitlist
 *
 * Validates email, writes { email, timestamp, source } to KV namespace
 * XPROHUB_WAITLIST. Returns JSON { ok: true } on success.
 *
 * KV binding: XPROHUB_WAITLIST must be bound in the Cloudflare Pages
 * project settings. Without it, the function returns a graceful error.
 */

interface Env {
  XPROHUB_WAITLIST?: KVNamespace;
}

interface WaitlistBody {
  email?: string;
}

// Basic email validation (not exhaustive — server-side sanity check)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // 1. Check KV binding
  if (!context.env.XPROHUB_WAITLIST) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Waitlist is not configured yet. Please try again later.' }),
      { status: 503, headers },
    );
  }

  // 2. Parse body
  let body: WaitlistBody;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid request.' }),
      { status: 400, headers },
    );
  }

  // 3. Validate email
  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Please enter a valid email address.' }),
      { status: 400, headers },
    );
  }

  // 4. Check for duplicate
  const existing = await context.env.XPROHUB_WAITLIST.get(email);
  if (existing) {
    // Already signed up — treat as success (don't leak that fact)
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers },
    );
  }

  // 5. Write to KV
  const entry = JSON.stringify({
    email,
    timestamp: new Date().toISOString(),
    source: 'landing-page',
  });

  await context.env.XPROHUB_WAITLIST.put(email, entry);

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers },
  );
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
