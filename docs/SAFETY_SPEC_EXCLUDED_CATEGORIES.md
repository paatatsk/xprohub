# XProHub Safety Spec — Excluded Categories

**Child Care and Elder Care are deliberately excluded from v1. They must not be re-enabled without first building a real verification system. This document is the reason why.**

Status: Binding safety decision. Subordinate to `XPROHUB_DOCTRINE.md`. Governs which categories the platform may list and what must exist before high-risk categories return.

Author: Paata (founder) · Shaped with Maestro, pressure-tested with Gemini · Date: 2026-06-02

---

## 0. The decision

**Child Care (category id 4) and Elder Care (category id 5) are removed from v1 entirely** — hidden from the Home grid, the post-a-job picker, Market filters, and the worker ID-card skill pickers. They are soft-deactivated (`is_active = false`), not deleted, so they can be reintroduced later if and only if a safe path is built.

The founder's standard, stated plainly: **"I'd rather not have them than cause any issues."** For vulnerable-population work — children and elderly people, often in private homes — the risk of facilitating an unvetted connection is unacceptable for a platform that cannot yet verify provider fitness. Not offering the category is safer than offering it with weak assurances.

---

## 1. Why these two specifically

These were the **only** two categories in the taxonomy flagged `requires_background_check = true`, and all 17 of their tasks were flagged `requires_verification = true`. The data already classified them as the highest-risk categories — the flags simply enforced nothing in code. This decision aligns actual behavior with what the taxonomy already signaled.

The excluded tasks (17 total): Child Care — babysitting, after-school care, school drop-off/pickup, overnight babysitting, newborn parent helper, kids' meal prep, educational play, homework supervision, special-needs childcare. Elder Care — companionship, medication reminders, senior meal prep, light housekeeping for elderly, medical appointment transport, senior grocery/prescription pickup, tech help for seniors, overnight (non-medical) elder care.

These involve unsupervised access to children, medical-adjacent tasks, and care for dependent adults — exactly the work where a forged credential or bad actor causes real, irreversible harm.

---

## 2. Why exclusion, not disclaimers or displayed credentials

Three options were weighed and rejected for v1:

- **Displayed credentials (worker uploads a cert, customer decides):** ethically thin for child/elder safety. A customer in a hurry cannot reliably evaluate a document's authenticity, and a forged certificate is easy to produce. "We showed you the document" is not protection.
- **Disclaimers ("we don't verify these providers"):** do not protect the platform — legally or morally — if an incident occurs. A single childcare failure could end the platform, and rightly so.
- **A general-post escape hatch (let care work flow through open posts):** quietly reintroduces the same risk through a side door. The liability lives in the *facilitated connection*, not the category label. Removing the category but allowing the same transaction informally is a half-open door, harder to defend than a closed one.

**The platform's position in v1: XProHub does not currently facilitate childcare or elder care.** Full stop.

---

## 3. What must exist before these categories return

Reintroduction is permitted ONLY after a real verification path exists. The reactivation is trivial (`UPDATE ... SET is_active = true`); the *gate* is what must be built first. Minimum requirements before any care category is re-enabled:

- **Identity verification** of providers (government ID matched to selfie — e.g. Stripe Identity), gated at apply-to-work.
- **Real background checks** for care providers specifically (e.g. Checkr or equivalent), not self-uploaded documents.
- **A vetting process** — at minimum a manual "concierge" track where the founder personally vets the first providers at the platform's own cost, before any automated open application.
- **Honest labeling** — the platform may only use words like "Verified" or "Certified" for checks it has actually performed. Self-uploaded documents are labeled "Self-Reported," never "Verified."
- **Terms of Service** that clearly separate the platform (marketplace operator) from the provider (service provider).

Until ALL of the above exist for a given care category, it stays `is_active = false`.

---

## 4. The tiered model these categories will eventually fit

When verification is built, it follows a **verification-by-risk** model (cost scales with risk, not applied uniformly):

| Tier | Risk | Requirement |
|---|---|---|
| Everyday (tier 1) | Low | Identity verification at apply-to-work |
| Pro trades (tier 2) | Moderate | Identity + self-reported credential display ("Self-Reported," not "Verified") |
| Care (excluded in v1) | Extreme | Identity + real background check + manual vetting → only then "Verified/Certified" |

Identity verification gates at the moment of *applying to work*, not at signup — protecting safety on the provider side without taxing the early signups the marketplace needs for liquidity.

---

## 5. What this binds

- Child Care (id 4) and Elder Care (id 5) are `is_active = false` in v1 and hidden from every category surface.
- They are soft-deactivated, never deleted — reversible, but only per §3.
- **No care category may be re-enabled without the full verification path in §3 built first.** Seeing `is_active = false` is not an invitation to flip it on.
- The word "Verified"/"Certified" is reserved for checks the platform actually performed.
- The platform does not facilitate childcare or elder care — through categories OR general posts — in v1.

---

*Choosing not to offer a service you cannot make safe is not a gap in the product. It is the product being honest about what it can protect.*
