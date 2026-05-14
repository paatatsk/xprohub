# xprohub-auto-release — Cloudflare Worker

Cron-triggered Worker that auto-releases payments to workers when
the 72-hour confirmation window expires. Runs every 15 minutes.

See docs/CHUNK_E_DESIGN.md — Auto-Release Mechanism for design context.

## Prerequisites

- Node.js installed (already have it for Expo)
- Cloudflare account (already exists from Task 5)

## Deployment

### Step 1: Install wrangler (if not already installed)

```
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```
wrangler login
```

Opens browser for OAuth — use the same Cloudflare account as xprohub.com Pages.

### Step 3: Navigate to the Worker directory

```
cd cloudflare/auto-release
```

### Step 4: Deploy the Worker

```
wrangler deploy
```

First deploy creates the Worker. Cron trigger activates automatically from wrangler.toml.

### Step 5: Set secrets

Interactive prompt — no shell encoding issues.

```
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Paste from: Supabase dashboard → Settings → API → service_role (NOT anon).

```
wrangler secret put RELEASE_PAYMENT_SECRET
```

Paste the same value you set in Supabase Edge Function secrets via dashboard when deploying E-5.

### Step 6: Verify in Cloudflare dashboard

- Workers & Pages → xprohub-auto-release → Triggers
- Confirm cron `*/15 * * * *` is listed and active
- Check Logs tab for `[auto-release] Cron fired at ...` entries (first entry appears within 15 minutes of deploy)

### Step 7: Health check

```
curl https://xprohub-auto-release.<your-subdomain>.workers.dev/
```

Expected: `{"status":"ok"}`

## Testing manually

Before the first cron fires:

```
wrangler dev --test-scheduled
```

Then in another terminal:

```
curl http://localhost:8787/__scheduled
```

Check wrangler terminal for log output.

## Secrets reference

| Secret | Source | Notes |
|---|---|---|
| SUPABASE_SERVICE_ROLE_KEY | Supabase dashboard → Settings → API | NOT the anon key |
| RELEASE_PAYMENT_SECRET | Same value as Supabase Edge Function secret | Set via dashboard per D-8 lesson |

SUPABASE_URL is in wrangler.toml [vars] — not secret (public project ref).
