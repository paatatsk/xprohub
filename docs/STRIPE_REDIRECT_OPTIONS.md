# Stripe Redirect Proxy — Architectural Options

**Created:** 2026-05-07
**Context:** Stripe `accountLinks.create` requires `return_url` and
`refresh_url` to be valid HTTPS URLs. The app uses a custom URL scheme
(`xprohub://`) for deep linking. A proxy is needed to bridge HTTPS →
custom scheme after the user completes the Stripe onboarding form.

**Current state:** `stripe-redirect` Edge Function (v3, `verify_jwt =
false`) returns correct HTML with meta-refresh, JS redirect, and a
visible button — but Supabase's gateway overrides `Content-Type` to
`text/plain` and applies `Content-Security-Policy: default-src 'none';
sandbox` on unauthenticated Edge Functions. The browser renders raw
source text. Neither auto-redirect nor button works.

**Impact:** Post-onboarding return-to-app UX only. Not blocking core
functionality — webhook → DB → gate path works fine. User must manually
switch back to the app after completing Stripe form.

---

## Option A — JWT-verified Edge Function

**Approach:** Set `verify_jwt = true` on `stripe-redirect`. Pass a JWT
token as a query parameter in the `return_url` so the Edge Function
receives it. Supabase would not apply the restrictive CSP.

**Feasibility:** Low. Stripe controls the redirect URL — it sends the
user's browser to the `return_url` exactly as provided. There is no way
to inject a fresh, valid Supabase JWT into the URL at redirect time.
JWTs expire (default 1 hour), so even if one were embedded at link
creation time, it could expire before the user finishes the form. And
exposing JWTs in URLs is a security anti-pattern (logged in server
access logs, browser history, referer headers).

**Setup cost:** N/A — architecturally infeasible.

**Production-readiness:** Not viable.

**Blockers:** Fundamental mismatch between Stripe's redirect model and
Supabase's JWT verification requirement.

**Recommendation: Reject.**

---

## Option B — External HTML hosting

**Approach:** Host a static HTML redirect page on a service that serves
`text/html` without restrictive CSP. Candidates: GitHub Pages (free),
Vercel (free tier), Netlify (free tier), or Supabase Storage (part of
existing project).

The page would be identical to the current `stripe-redirect` HTML —
meta-refresh + JS redirect + visible button targeting
`xprohub://stripe-return`.

`create-onboarding-link` would set `return_url` and `refresh_url` to
the external hosted page URLs instead of the Edge Function.

**Feasibility:** High. All candidates serve HTML with proper
`Content-Type: text/html` and no restrictive CSP by default.

**Setup cost:**
- GitHub Pages: ~15 minutes. Create a repo (or use `gh-pages` branch
  on existing repo), add two HTML files (`return.html`, `refresh.html`),
  enable Pages. Free, no custom domain required (uses
  `paatatsk.github.io/xprohub-redirect/return.html`). Custom domain
  optional.
- Vercel: ~10 minutes. Connect repo or deploy static files. Free tier.
- Supabase Storage: ~10 minutes. Upload HTML files to a public bucket.
  Served from `ygnpjmldabewzogyrjbb.supabase.co/storage/v1/object/
  public/...`. Already part of the project — no new account needed.

**Production-readiness:** High for all candidates. GitHub Pages and
Vercel are battle-tested static hosting. Supabase Storage is the
simplest since it's already in the project infrastructure.

**Blockers:**
- GitHub Pages: none (Paata has a GitHub account).
- Vercel: requires Vercel account setup if not already done.
- Supabase Storage: need to verify that Storage serves files with
  `Content-Type: text/html` and without restrictive CSP. Test with a
  single file upload before committing to this approach.

**Recommendation: Strong candidate. Supabase Storage is the path of
least resistance — no new accounts, no new infrastructure.**

---

## Option C — Stripe return_url to owned domain

**Approach:** Register a custom domain (e.g., `app.xprohub.com`) and
host the redirect page there. Stripe redirects to
`https://app.xprohub.com/stripe-return`, which serves the HTML page.

This is the "proper" production approach used by companies like Uber,
Airbnb, etc. The domain also enables iOS Universal Links (Option D).

**Feasibility:** High, but requires domain purchase and DNS setup.

**Setup cost:**
- Domain: ~$12/year if not already owned. Check if `xprohub.com` is
  available or already registered by Paata.
- DNS: point subdomain to hosting provider (Vercel, GitHub Pages, or
  any static host).
- SSL: automatic via most hosting providers.
- Timeline: 30–60 minutes if domain is already owned. Longer if domain
  needs to be purchased and DNS propagated.

**Production-readiness:** Highest. Custom domain is the professional
standard. Also enables Universal Links (Option D) as a natural
extension.

**Blockers:**
- Domain ownership — does Paata own `xprohub.com`?
- Cost — ~$12/year (domain) + hosting (free tier on most providers).
- DNS propagation — can take up to 48 hours, though usually <1 hour.

**Recommendation: Best long-term option, but overkill for current dev
phase. Revisit before NYC launch.**

---

## Option D — iOS Universal Links

**Approach:** Instead of custom URL schemes (`xprohub://`), use
Universal Links (`https://app.xprohub.com/stripe-return`). iOS
intercepts HTTPS URLs that match an `apple-app-site-association`
(AASA) file hosted on the domain and opens the app directly — no
browser intermediate, no redirect needed.

Stripe's `return_url` would be an HTTPS URL that iOS recognizes as a
Universal Link. When the user finishes the form, Safari navigates to
the URL, iOS intercepts it, and the app opens directly at the
matching route.

**Feasibility:** Medium-high. Requires a custom domain (Option C) plus
AASA file hosting and Expo/Xcode configuration.

**Setup cost:**
- Everything from Option C (domain, DNS, SSL).
- AASA file: JSON file hosted at
  `https://app.xprohub.com/.well-known/apple-app-site-association`.
  Must be served with `Content-Type: application/json`, no redirects.
- Expo config: add `associatedDomains` to `app.json`:
  `"ios": { "associatedDomains": ["applinks:app.xprohub.com"] }`.
- Requires EAS rebuild (native config change).
- Timeline: 1–2 hours if domain is ready. Plus EAS build time.

**Production-readiness:** Highest possible. This is how production
apps handle deep linking. Eliminates the entire redirect proxy
problem — no intermediate page, no custom scheme restrictions.

**Blockers:**
- Requires Option C first (custom domain).
- Requires EAS rebuild (native config change — flags stop condition).
- AASA file must be served correctly (specific Content-Type, no
  redirects, accessible from Apple's CDN crawler).
- Testing requires production or TestFlight build (not Expo Go).

**Recommendation: The right answer for production. Implement when
preparing for NYC launch, alongside Option C. Not for current dev
phase.**

---

## Option E — HTTP 302 redirect from Edge Function

**Approach:** Instead of returning an HTML page (status 200 with
`text/html` body), return an HTTP 302 redirect with a `Location`
header pointing to the custom scheme URL.

```ts
return new Response(null, {
  status: 302,
  headers: { 'Location': destination },
})
```

The browser receives a redirect instruction, not an HTML page. No
`Content-Type` or CSP issues because there's no body to render.

**Feasibility:** Medium. HTTP 302 to custom URL schemes has mixed
browser support:
- Safari on iOS: historically supports 302 to custom schemes IF the
  scheme is registered. Some reports of inconsistency across iOS
  versions.
- Chrome on iOS: generally follows 302 to custom schemes.
- Key risk: Supabase's gateway might strip or block `Location` headers
  with non-HTTP schemes. The `X-Content-Type-Options: nosniff` and
  CSP headers we saw suggest aggressive gateway behavior. Need to test.

**Setup cost:**
- Code change: ~2 lines in `stripe-redirect/index.ts`. Replace the
  HTML Response with a 302 Response.
- Deploy: `npx supabase functions deploy stripe-redirect`.
- Test: curl to verify `Location` header passes through Supabase
  gateway, then iPhone test.
- Timeline: 10 minutes to implement + deploy, 5 minutes to test.

**Production-readiness:** Medium. If it works through Supabase's
gateway and across iOS versions, it's the simplest solution. If the
gateway strips the `Location` header, it fails silently (user sees
blank page).

**Blockers:**
- Unknown: whether Supabase's gateway allows `Location` headers with
  custom scheme URLs on 302 responses from unauthenticated functions.
  Must test empirically.
- Browser compatibility: 302 to custom schemes is not part of any spec
  and behavior varies. Works in most modern mobile browsers but not
  guaranteed.

**Recommendation: Test first. If it works through the gateway, this is
the fastest and simplest fix — no new infrastructure, no new accounts,
no domain purchase. 10 minutes to know.**

---

## Summary and Recommendation

| Option | Feasibility | Cost | Timeline | Production-ready |
|---|---|---|---|---|
| A. JWT endpoint | Not viable | N/A | N/A | No |
| B. External HTML hosting | High | Free | 10–15 min | Yes |
| C. Owned domain | High | ~$12/yr | 30–60 min | Yes (best) |
| D. Universal Links | Medium-high | ~$12/yr + rebuild | 1–2 hours | Yes (best) |
| E. HTTP 302 redirect | Medium | Free | 10 min | Maybe |

**Recommended path: Try E first, fall back to B.**

Option E (302 redirect) is a 10-minute test with zero infrastructure
cost. Change 2 lines, deploy, curl to check if the `Location` header
survives the Supabase gateway, then iPhone test. If it works, the
problem is solved with no new accounts, no hosting, no domain.

If E fails (gateway strips `Location` header), fall back to Option B
using **Supabase Storage** — upload two static HTML files to a public
bucket in the existing Supabase project. No new infrastructure, no new
accounts, ~15 minutes.

Options C and D are the right answers for production launch but are
overkill during development. Revisit when preparing for NYC launch.

Option A is rejected — architecturally infeasible.

**Decision belongs to Paata.** This memo provides the analysis; Paata
chooses the path.
