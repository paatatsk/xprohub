# Receipt — Handoff Package

> Design → Code round trip · XProHub · 22 May 2026
> From: Claude (design) · To: Claude Code (build)

## What's in this folder

| File | What it is | For |
|---|---|---|
| `customer-view.html` | Pixel-faithful web mock of the screen | Visual review, layout reference |
| `RECEIPT_SPEC.md` | The build spec — thesis, layout, tokens, states, interactions, accessibility, open questions | The brief Claude Code builds from |
| `data.ts` | TypeScript interface for `ReceiptData` | Drop directly into the codebase |
| `copy.md` | Every string + tone rules + forbidden phrasings | i18n catalog source / copy review |
| `Receipt.tsx` | React Native reference implementation | Skeleton for production component |

## How to use this package

**If you're Claude Code:**

1. Read `RECEIPT_SPEC.md` first. It's the brief.
2. Open `customer-view.html` in a browser to see the visual target.
3. Copy `data.ts` into `app/job/[id]/data.ts` (or wherever feels right in the file tree).
4. Use `Receipt.tsx` as the starting skeleton at `app/job/[id]/receipt.tsx`.
5. Replace the stubbed `useReceipt` hook with a real Supabase fetch.
6. Add `@expo-google-fonts/ibm-plex-mono` to dependencies and load in `_layout.tsx`.
7. Run through the verification checklist at the bottom of `RECEIPT_SPEC.md`.

**If you're reviewing the design:**

1. Open `customer-view.html` and `audition/index.html` side-by-side.
2. Read the **Thesis** section of `RECEIPT_SPEC.md` to align on intent.
3. Skim `copy.md` — that's where the brand voice lives.

## What ships first (v1)

- Customer view, happy path
- Endorse + concern flows wired
- Share sheet stubbed (returns in-app deep link only — PDF generation deferred)
- Photo viewer stubbed (tap is no-op for v1)

## What's deferred

- Worker view (`viewerRole === 'worker'`) — copy + structure already specced; ship after v1
- Photo viewer modal (full-screen swipe-zoom)
- PDF generation for share sheet
- The 10 states beyond happy path (see `RECEIPT_SPEC.md`)
- `v_receipt_data` SQL view (would simplify the client significantly)

## Open questions back to Paata

Listed in `RECEIPT_SPEC.md → Open questions`. The two that matter most for v1:

1. **Photo storage** — bucket name, size cap, compression. Need an answer before workers can upload.
2. **`v_receipt_data` SQL view** — worth the migration? Simplifies the client fetch dramatically.

---

*Brought to you by the orchestra. Looking forward to hearing the round trip.*
