# LANDING_PAGE_ASSETS_HANDOFF.md
**XProHub landing page — visual asset handoff for Claude Code**
Self-contained. Code does not need to see the design canvas or the exports preview. Everything required to drop these PNGs into `web/index.html` / `web/style.css` is below. Follow it literally.

Theme is **Dark Gold (locked)**: background `#0E0E0F`, card `#171719`, border `#2E2E33`, gold `#C9A84C`, text `#FFFFFF` / secondary `#888890`. Every asset is built for the dark ground — none go on white.

---

## 1 · ASSET INVENTORY

All six files ship in the same folder as this doc.

| # | Filename | Pixel size | Background | What it shows |
|---|---|---|---|---|
| 1 | `Phone-Receipt.png` | 924 × 1080 | **Transparent** (soft light halo in the margin) | iPhone frame showing the completed-job **Receipt** — "Maria Reyes", itemized paystub, **PAID TO MARIA $139.50** in gold. |
| 2 | `Phone-Market.png` | 924 × 1080 | **Transparent** (soft light halo in the margin) | iPhone frame showing the **Live Market** jobs feed — "XProHub Market" masthead, JOBS/LABORERS toggle, an URGENT "Deep clean 2BR" card at $120–180. |
| 3 | `Phone-Worker.png` | 924 × 1080 | **Transparent** (soft light halo in the margin) | iPhone frame showing the **Worker Credential** ("Laborer Pass") — cardholder **David Park**, licensed electrician, endorsements, 247 jobs / 98% on-time / $31 avg-hr. |
| 4 | `Preview-Row.png` | 1848 × 1080 | **Solid** `#0E0E0F` (alpha channel present but fully opaque) | All three phones above, pre-composed in one row on the dark ground under the masthead headline **"Real work. Fair pay. For everyone."** with numbered captions. |
| 5 | `Hero-Receipt-Is-The-Ad.png` | 1848 × 1080 | **Solid** `#0E0E0F` (fully opaque) | Hero option v1. Centered editorial layout: eyebrow "THE XPROHUB LEDGER", headline **"The Receipt Is the Ad."**, and a giant gold glowing **$139.50** with the $155 → −$15.50 → $139.50 fairness breakdown. No phone, no CTA. |
| 6 | `Hero-Receipt-Phone.png` | 1848 × 1080 | **Solid** `#0E0E0F` (fully opaque) | Hero option v2. Two-column: headline **"The Receipt / Is the Ad."** + subhead + **$139.50 paid to Maria Reyes** + **GET STARTED** / **SEE A LIVE RECEIPT** CTAs on the left, the receipt phone angled on the right. |

**Note on the three phone PNGs:** the phone does not fill the 924×1080 box — it sits in a transparent margin that carries a soft light drop-shadow glow. That halo is intentional and reads correctly only on the dark ground. ~34% of pixels are fully transparent, ~31% semi-transparent (the glow). **Do not place these on a white or light background** — the glow will look like a grey smudge.

---

## 2 · INTENDED PLACEMENT (by section)

The page has six sections: **HERO · HOW IT WORKS · THE PROMISE · FOR EVERYONE · APP PREVIEW · FOOTER.**

| Section | Asset(s) | Role |
|---|---|---|
| **HERO** | `Hero-Receipt-Phone.png` (v2) — see §3 for the recommended implementation | Top of page. The recommended direction; default is to recreate it in live HTML with the transparent phone, baked PNG as fallback. |
| **HOW IT WORKS** | *No dedicated PNG.* Keep as CSS/text (3 numbered steps). Optional: reuse `Phone-Market.png` as a supporting visual for the "browse / post" step if a visual is wanted — but do not invent new imagery. | — |
| **THE PROMISE** | `Hero-Receipt-Is-The-Ad.png` (v1) | This is the home for hero option v1. The $155 → $139.50 fairness math IS the promise ("Fair Pay"). Drop it in as a full-width band. |
| **FOR EVERYONE** | *No dedicated PNG.* Keep as CSS/text (the dual-role "customer + worker" message). | — |
| **APP PREVIEW** | The three phones — `Phone-Receipt.png`, `Phone-Market.png`, `Phone-Worker.png` (→ `receipt.png` / `market.png` / `profile.png`, see §4). `Preview-Row.png` is the pre-composed fallback. | The "see the product" row. |
| **FOOTER** | *No PNG.* Wordmark/contact stay as existing text. | — |

**Which assets are which:** the **App Preview** assets are the **3 phones** (`Phone-Receipt`, `Phone-Market`, `Phone-Worker`) **plus the composed `Preview-Row.png`**. The **hero options** are the two **1848×1080** boards (`Hero-Receipt-Is-The-Ad`, `Hero-Receipt-Phone`). Hero v1 is reassigned to **THE PROMISE**; only hero v2 is proposed for the actual HERO.

---

## 3 · HERO RECOMMENDATION

**Recommended direction: `Hero-Receipt-Phone.png` (v2).** It is a complete, conversion-ready hero — headline, subhead, the gold payout, the named worker, and two CTAs alongside a real product screen — whereas v1 (`Hero-Receipt-Is-The-Ad`) is a pure typographic centerpiece with no CTA and no product shot. v2 sells the proposition AND shows the app; v1's strength (the fairness math) is better spent one section down in **THE PROMISE**.

**The current live hero is CSS/HTML text** (`<h1>XPROHUB</h1>` + tagline). 

**Default to implement → option (c), layered, recreated in live HTML.** Do this:
1. Keep a **real `<h1>` and a real clickable CTA button** — accessibility, SEO, and a working "GET STARTED" link matter more than a pixel-perfect baked image.
2. Lay the hero out as **two columns** (text left, image right) mirroring `Hero-Receipt-Phone.png`, and drop the **transparent `Phone-Receipt.png`** into the right column on the dark ground.
3. Use the text from the asset: eyebrow **"THE XPROHUB LEDGER"**, headline **"The Receipt Is the Ad."** ("Is the Ad." in gold italic Playfair), subhead "Every job ends in a paystub. The worker's pay — itemized, public, and in gold.", and the pulled-out **$139.50 · PAID TO Maria Reyes** stat.

**Fallback (no time to recreate):** use `Hero-Receipt-Phone.png` as a single full-bleed `<img>` and overlay one transparent anchor as the GET STARTED hotspot. **Only acceptable at ≥720px** — the baked text gets too small on phones (see §5). Do **not** use option (a) "replace with a flat baked image" as the primary mobile hero for that reason, and do not use (b) (hiding the image elsewhere) — v2 belongs at the top.

---

## 4 · EXACT FILE PLACEMENT (repo paths)

Copy all PNGs into **`web/img/`**. The web build expects the App-Preview images named `market.png`, `receipt.png`, `profile.png` — **rename on copy** as follows:

| Source filename (this folder) | → Target path in repo |
|---|---|
| `Phone-Receipt.png` | `web/img/receipt.png` |
| `Phone-Market.png` | `web/img/market.png` |
| `Phone-Worker.png` | `web/img/profile.png`  *(worker credential = the "profile" slot)* |
| `Hero-Receipt-Phone.png` | `web/img/hero.png` |
| `Hero-Receipt-Is-The-Ad.png` | `web/img/promise.png` |
| `Preview-Row.png` | `web/img/preview-row.png`  *(fallback; not one of the three expected slots)* |

So the three expected App-Preview slots fill exactly: **`Phone-Market.png → web/img/market.png`**, **`Phone-Receipt.png → web/img/receipt.png`**, **`Phone-Worker.png → web/img/profile.png`**. Reference them in markup as `img/receipt.png`, etc. (relative to `web/index.html`).

---

## 5 · RESPONSIVE / SIZING GUIDANCE

Page is mobile-first, content max-width **~720px**.

**Aspect ratios (set width + `height:auto`, never hard-code height):**
- Phones `Phone-*.png` → **924×1080 ≈ 0.86:1** (tall portrait).
- Heroes & row → **1848×1080 ≈ 1.71:1** (≈16:9).

**HERO**
- Recreated live-HTML hero (recommended): two columns at ≥720px (text 1fr / phone 1fr); **stack to one column below 720px** (text first, then phone). Phone image `max-width: 320px` desktop, `max-width: 78vw` (cap ~340px) on mobile, centered.
- Baked `hero.png` fallback: `width:100%; height:auto; max-width:1100px`. Acceptable only ≥720px — below that the embedded text is too small; switch to the live-HTML hero via your breakpoint.

**THE PROMISE — `promise.png`**
- `width:100%; height:auto; max-width:960px`, centered on the dark ground. The giant `$139.50` stays legible down to ~420px; below that it's still readable but consider the live-HTML hero treatment if you want crisper small-screen text. No horizontal scroll needed.

**APP PREVIEW — the three phones**
- **Desktop (≥720px):** 3-up `display:grid; grid-template-columns:repeat(3,1fr); gap:24px;`. Each phone `max-width:300px`, `height:auto`, justified center. Sits on `#0E0E0F` (or a `#171719` card band).
- **Mobile (<720px): use a horizontal scroll, not a stack.** Three tall phones stacked makes the section enormous. Use `display:flex; overflow-x:auto; gap:16px; scroll-snap-type:x mandatory;` with each phone `flex:0 0 70vw; max-width:300px; scroll-snap-align:center;`. Hide the scrollbar, add ~16px inline padding so the first/last card isn't flush.
- **Alternative:** drop in `preview-row.png` as one responsive `<img width:100%; height:auto>` — simplest, but its internal captions shrink with the image and there is a minor caption overlap in the composed board, so the **individual-phones-with-scroll approach is preferred**; keep `preview-row.png` as the quick fallback.

---

## 6 · DATA CONSISTENCY (must fix)

The current **live HERO says "Maria S."** — the assets say **"Maria Reyes"** in full. **"Maria S." is wrong. Canonical name everywhere is `Maria Reyes`.** Update the live hero and any other copy to match.

Two distinct, intentional personas — keep both, do not merge:
- **Maria Reyes** — the worker in the **receipt / hero / promise** payout story (a house cleaner). Use her name and figures anywhere the payout/fairness story appears.
- **David Park** — the worker on the **Worker Credential** card (`profile.png`), a licensed electrician. He is the credential example only; leave him as-is.

**Canonical figures — must be identical in HERO, THE PROMISE, and any payout copy:**
- Customer paid: **$155.00**
- XProHub platform fee (10%): **−$15.50**
- Worker keeps (Maria Reyes): **$139.50**
- Job context: deep clean of a **2-bedroom apartment in Brooklyn**, **4 hr 20 min**, completed **22 May 2026**.

So: **$155 paid → $139.50 to the worker (Maria Reyes)**. Never show a different split or a "Maria S." short form.

---

## 7 · CSS NOTES (beyond `CLAUDE.md`)

`CLAUDE.md` already defines the color tokens and the three core fonts (**Space Grotesk** headlines, **Playfair Display** serif accent, **Inter** body). The assets additionally rely on these, which are **not** in `CLAUDE.md` — add them:

**Fonts**
- **Oswald** (SemiBold/Bold) — eyebrows, tickers, all-caps wide-tracked labels ("THE XPROHUB LEDGER", "REAL WORK · FAIR PAY · FOR EVERYONE"). Needed only if you recreate hero text in live HTML.
- Google Fonts import for a live-HTML hero:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
  ```
- (IBM Plex Mono was used for caption/ID microtext in the asset preview only — **not** required on the landing page.)

**Background behind transparent PNGs**
- The three phone PNGs MUST sit on **`#0E0E0F`** (page ground) or **`#171719`** (card band). Their built-in light halo only works on dark. Never on white/light.

**Spacing & radius (8-pt system — not in `CLAUDE.md`)**
- Spacing scale: **4 · 8 · 16 · 24 · 32 · 48**. Section vertical padding ~48–64px; container padding 24px screen-edge, 16px on cards.
- Radius: **8 (sm) · 12 (default card/input) · 16 (lg) · 999 (pill — buttons, badges)**.
- Content column max-width **720px** (already the page baseline).

**Gold "big number" glow** (matches the $139.50 in the assets):
```css
.bignum { color:#C9A84C; font-family:'Space Grotesk',sans-serif; font-weight:700;
          text-shadow:0 0 40px rgba(201,168,76,0.35); }
```

**Tracking / letter-spacing** used in the assets: eyebrows **5–6px**, button labels **1.5px**, `XPROHUB` wordmark **4px**, tickers **2–3px**.

**Buttons** (to match the GET STARTED pill): gold fill `#C9A84C`, ink text `#0E0E0F`, `border-radius:999px`, all-caps, letter-spacing 1.5px, font Space Grotesk 700. Secondary CTA ("SEE A LIVE RECEIPT") = gold text, no fill, gold underline.

**No drop shadows, no gradients** (except the gold text-glow above), per the locked design system. Elevation = `#2E2E33` 1px border, upgraded to a 1px gold border + `0 0 24px rgba(201,168,76,0.18)` glow for emphasis.

---

*End of handoff. All six PNGs + this file are in the same folder — copy them together into `web/img/` using the §4 mapping.*
