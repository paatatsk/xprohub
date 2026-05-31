XProHub Doctrine
The foundational product tenet. Everything answers to this.
Status: Binding north star. Where any spec, ruling, or design decision conflicts with this document, this document wins — but it governs intent and priority, not pixels. Pixel-level specs (NAV_SPEC, design rulings) implement this; they do not override it.
Author: Paata (founder) · Shaped with Maestro · Date: 2026-05-31
Tagline it serves: Real Work. Fair Pay. For Everyone.

0. Why this document exists
Screen-by-screen specs decide each surface well, but without a single statement of what the app is for, every decision gets re-argued on aesthetics. That is how one button took five rounds. This document is the north star those decisions are measured against. Before adding, moving, or beautifying anything, check it here first.

1. What XProHub is for
XProHub exists to complete one transaction, seen from two sides: a customer gets a job done, and a worker gets paid. Nothing else is the point. Every screen, control, and flourish is judged by a single test:

Does this move the user closer to "job done / worker paid"? If yes — how often is it touched, and place it by that answer. If no — it is support, and it must not stand in front of the flow.

Beauty, sophistication, and polish serve the flow. They never block it, slow it, or take its place. A surface that is gorgeous but rarely touched does not earn front-page real estate. (See §5, the Placement Law.)

2. The dual role is behavior, not a setting
Every user is both customer and worker. This is not a profile toggle — it is how people act. The same person posts a job in the morning and applies to one at night. The interface must never force a user to "be in customer mode" or "worker mode"; it must let both intents live side by side, because that duality is the product's thesis: Real Work. Fair Pay. For Everyone.
Role-mixing on a single surface (e.g. a hirer action sitting beside a worker credential on Home) is therefore correct, not messy. The axis to keep clean is verb (initiate vs. navigate vs. commit), never role. When a surface feels cluttered, the fix is almost always to separate by verb — not to segment by role, which would re-introduce the fork the product exists to refuse.

3. The four entries and the one spine
There are four ways into a transaction and one shared spine they all converge on. The convergence is the real structure of the app.
Customer entries
C1 — Post and match
create a post → publish the post → review applications → [enter spine]
C2 — Direct hire from a card
browse worker ID Card listings → choose a worker → [enter spine]
Worker entries
W1 — Be discovered
create / edit ID Card → publish it → receive a direct-hire request → [enter spine]
W2 — Go discover
browse published jobs on the Live Market → apply to ones you want → application approved → [enter spine]
The shared spine (all four converge here)

communicate → agree on terms, conditions, and price → hire → arrange the meeting → work gets done → confirm completion & release payment → (optionally) endorse

The sequence is binding. Agreement on terms precedes hire. Payment releases only on confirmed completion. Endorsement is always optional and always last. No surface may reorder these steps or let a user skip a required one.
"Agree on terms" is its own explicit step in every entry, because it is where disputes are prevented. The interface must make terms — scope, price, timing — explicit and shared before money or commitment is on the line. Never buried, never assumed.

4. What each entry needs from the interface
Reading the four entries tells you what must be fast and obvious:
The user wants to…So this must be fastLives onPost a job (C1)Create + publish a postLaunchpad + MarketHire someone directly (C2)Browse cards, open one, start contactMarketGet discovered (W1)Create / edit / publish my ID Card; see incoming requestsLaunchpad + MarketFind work (W2)Browse jobs, apply, track the applicationMarket + LaunchpadMove any deal forward (spine)Communicate, agree, confirm, payWherever the deal lives — reachable in one step
The spine is shared, so the conversation/deal thread is the most important object in the app after the listing itself. It must be reachable in one step from anywhere the user has an active deal. A user waiting to hear back, or waiting to get paid, should never hunt for where that lives.

5. The Placement Law
Real estate is assigned by centrality to the flow × frequency of use — not by how good something looks.

Permanent tab — on the critical path and touched constantly. (The Live Market, where transactions are initiated and matched.)
Tab, but not the spotlight — on the path but visited deliberately, not constantly. (The back office: history, bookkeeping, the record of completed deals.)
Launchpad entry — the fastest route into a flow the user is starting now.
Quiet home in the record — on the path but low-dwell and end-of-flow. Beautiful is not a reason to promote it. (A finished receipt: a ten-second glance, not a destination.)
Off the critical path — identity and configuration. Present, never prominent.

The receipt is the worked example of this law. It is the brand's lighthouse and it is beautiful — and it still belongs in the record, not the front page, because no one's goal is to look at a receipt. Their goal is to get paid; the receipt is the proof, reached when wanted.

6. The surfaces, each with one job
Defined by §5, not by tradition:

Live Market — where the transaction is initiated and matched: post, browse jobs, browse cards, apply, hire. The most-lived-in surface. This is where the action happens.
Home (the launchpad) — the fastest route into whichever flow you're starting: post a job, edit/publish my card, the applications I'm waiting on, the posts awaiting my review. Home is a launchpad, not a dashboard to admire. It links into the flow; it does not render full lists or earnings showcases for their own sake.
Desk (the back office) — the full record: history, earnings, payouts, completed deals, the bookkeeping. Visited on purpose, not constantly. Desk owns the complete lists; Home only links to the active items inside them.
Account — identity and configuration (including payout destination). Off the critical path entirely.


Boundary that follows from this: active, in-flight items (an application you're waiting on, a post awaiting your review) are reachable fast from the launchpad because they are live flow. The full record of them lives in the back office. Home links; Desk holds. Pure history never crowds the launchpad.


7. The tie-breaker
When speed-to-transaction conflicts with beauty or polish, speed wins. The fewest taps from intent to "job done / worker paid" is the governing metric. Polish is applied in service of that path, never as a tax on it.
Fairness and trust — the flat, honest fee; explicit terms before commitment; no dark patterns; no manipulation of the flow to extract engagement — are not in tension with speed. They are part of getting the user to a transaction they'll come back to repeat. A fast path the user doesn't trust is not fast; they won't take it twice.
Speed leads; trust is non-negotiable underneath it. Speed decides layout fights — the fewest taps wins. Trust decides what we will never do regardless of speed: we will not hide terms or fees to shave a tap, and we will not bend the flow to extract engagement. Speed is the optimization; trust is the floor.

8. How to use this document
Before any feature, layout, or polish decision, ask in order:

Which entry or spine step does this serve? If none — it is support; keep it back.
How central and how frequent? Place it by the Placement Law (§5), not by how it looks.
Does it preserve the spine sequence? (§3) Terms before hire; payment on confirmation; endorse last and optional.
Speed vs. polish? Speed leads (§7). Trust is never traded for either.

If a decision still feels hard after these four, the question is usually "we are mixing two different things in one control" — separate them by verb, not role.

The interface is not the product. The completed transaction is the product. The interface is how little stands between the user and it.
