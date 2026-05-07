import "@supabase/functions-js/edge-runtime.d.ts"

const ALLOWED_DESTINATIONS: Record<string, string> = {
  'return':  'xprohub://stripe-return',
  'refresh': 'xprohub://stripe-refresh',
}

Deno.serve((req: Request): Response => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')

  const destination = type ? ALLOWED_DESTINATIONS[type] : null

  if (!destination) {
    return new Response('Invalid redirect type', { status: 400 })
  }

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${destination}">
  <style>
    body { background: #0E0E0F; color: #fff; font-family: -apple-system, sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; text-align: center; }
    .card { padding: 40px 24px; }
    h1 { color: #C9A84C; font-size: 22px; margin-bottom: 8px; }
    p { color: #888890; font-size: 14px; margin-bottom: 24px; }
    a { display: inline-block; background: #C9A84C; color: #0E0E0F;
        font-weight: bold; font-size: 16px; padding: 14px 32px;
        border-radius: 8px; text-decoration: none; letter-spacing: 1px; }
  </style>
</head><body>
  <script>window.location.href="${destination}";</script>
  <div class="card">
    <h1>XPROHUB</h1>
    <p>Tap below to return to the app.</p>
    <a href="${destination}">RETURN TO XPROHUB</a>
  </div>
</body></html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
})
