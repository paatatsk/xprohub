# XProHub Financial Data Principle

**XProHub holds no sensitive financial detail. Stripe is the system of record for money. XProHub keeps only the transaction record.**

Status: Binding. Subordinate to `XPROHUB_DOCTRINE.md`. Governs every surface that touches money — the Receipt, the Desk, and any future financial screen. Where a feature would have XProHub store or display sensitive financial data, this document is the objection.

Author: Paata (founder) · Shaped with Maestro · Grounded in the shipped Receipt screen + Code investigation · Date: 2026-06-01

---

## 0. Why this document exists

Slice D (Desk) raised the question of showing payout destinations — masked bank last-4, transfer status. Pursuing it would have made the Desk the first place in the app to surface bank-routing detail. The founder ruled the opposite: XProHub should hold no such data at all. This document states the principle so no future surface reintroduces financial detail by accident.

**The mental model: the Desk is a drawer of receipts. You open it for your own recordkeeping — to see what you earned and spent through the platform, and to revisit any single transaction. The drawer holds paper records, not bank access. The real money lives at Stripe.**

---

## 1. The principle

- **Stripe is the system of record for money.** Balances, bank accounts, card numbers, payout routing, transfer arrival status — these live at Stripe and are reached through Stripe's own surfaces, never duplicated into XProHub.
- **XProHub stores only the transaction record:** what the job was, what the customer paid, the platform fee, what the worker received, and that it happened (with an opaque Stripe reference and a status).
- **XProHub displays only that record** — never sensitive financial detail.

This is already how the shipped Receipt screen works. This document generalizes that established behavior into a rule.

---

## 2. What XProHub MAY store and show

From the `payments` table, the only money data XProHub holds:
- `amount` — what the customer paid (transaction record)
- `platform_fee` — the 10% flat fee (3% Stripe + 7% ops)
- `worker_payout` — what the worker received
- `escrow_status` — held / released (a state, not an account)
- `released_at` / `auto_release_at` / `created_at` — timestamps
- `stripe_charge_id` / `stripe_transfer_id` — **opaque references**, not financial detail (a charge ID is a lookup key, not money access)

These describe *a transaction that occurred*. They are safe to store and show because they are the record of the deal, not access to anyone's finances.

---

## 3. What XProHub MUST NOT store or show

- Bank account numbers or bank last-4
- Card numbers, card last-4, or card brand
- Payout destination / routing detail (which bank/account receives money)
- Stripe account balances
- Transfer arrival status sourced from Stripe (pending / in-transit / paid) — XProHub tracks only its own escrow state (held → released), not Stripe's downstream transfer lifecycle
- Any other PII-grade financial identifier

If a surface needs any of the above, the answer is to **link the user to Stripe**, not to fetch and display it in XProHub.

> Consequence for Desk (Slice D): there is **no Payout History section** showing destinations or transfer status. Its only real content would have been routing detail this principle forbids. The earnings story is told by the Earnings total + the itemized Job History — both of which are transaction record, not financial access.

---

## 4. How money is represented (the record, not the account)

- **Earnings** = a sum of `worker_payout` over released payments in a period. A number, derived from the record.
- **Expenses** = a sum of `amount` over jobs the user hired for. The other side of the same record.
- **A single transaction** = the Receipt screen, which shows the three meaningful numbers (paid / fee / received), an opaque Stripe charge reference, and a status. No account detail.
- **Direction matters, not routing:** money in (earned) vs money out (spent) is worth showing — it's the dual-role record. *Where* the money came from or went (which bank) is not.

---

## 5. What this binds

- No XProHub surface stores or displays bank/card/routing detail or Stripe balances.
- Opaque Stripe references (charge/transfer IDs) are the only Stripe identifiers shown, and only as transaction trace.
- Money is shown as the *record of transactions* (amounts, fees, payouts, dates, in/out direction), never as account access.
- When sensitive financial detail is genuinely needed, link to Stripe — do not import it.
- The Desk is recordkeeping (a drawer of receipts), not a banking surface.

---

*The receipt is a record of work and fair pay — not a window into anyone's bank. The Desk keeps the records. Stripe keeps the money.*
