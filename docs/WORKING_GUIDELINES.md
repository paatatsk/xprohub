# Working Guidelines — How chat-Claude, Claude Code, and Paata Collaborate

> This file documents the operational patterns we've developed for working together on XProHub. It's the "how we work" companion to HANDOFF.md ("who we are") and CLAUDE.md ("what we're building"). New chat-Claude or Claude Code instances should read this after HANDOFF.md.

**Last updated:** 2026-05-11 (after Task 5 closure)
**Source:** Patterns codified from the 9-hour Task 5 session that shipped iOS Universal Links

---

## Core operating rules

### Rule 1 — Meticulous Mode is the default

Every code change follows this sequence:

1. **Investigate** — read files, cite line numbers, web-search docs when needed. Never propose changes from assumption.
2. **Consult** — surface tradeoffs with Paata before proposing. Name alternatives, recommend one, explain why.
3. **Propose OLD/NEW** — show the exact text being replaced and the exact replacement. Don't save yet.
4. **Approve** — Paata signs off explicitly. "Your call" = approved-with-judgment. Silence ≠ approval.
5. **Save** — Claude Code applies the change to working tree. Still uncommitted.
6. **Verify** — `tsc --noEmit`, `deno check`, `git status`, empirical iPhone test if relevant.
7. **Commit** — only after verification passes. Often only after multiple slices accumulate.

If any step fails, return to step 1. Don't bandage-fix.

### Rule 2 — Empirical validation trumps theoretical correctness

A change isn't done until it's proven on the device. We don't trust:
- "The code looks right"
- "The build succeeded"
- "The deploy went through"

We trust:
- "I tapped the link on the iPhone and the app opened"
- "I saw the JSON render with Pretty-print enabled"
- "I confirmed Cloudflare shows Active + SSL enabled"

When something seems to work in theory but hasn't been device-tested, name that gap explicitly: "this should work but isn't validated."

### Rule 3 — Build it properly once

We avoid bandaid fixes. If something needs fixing, fix it right.

Examples of "right":
- Catching that the cold-start race exists, then doing a real investigation, then applying the official Expo Router pattern (`<Redirect>` component) — not adding a setTimeout hack
- Discovering the stripe-redirect HTML proxy was structurally wrong, then implementing Universal Links — not patching the proxy

Examples of bandaids we reject:
- Silent try/catch around an error we don't understand
- "TODO: fix later" comments without a tracked task
- Hardcoded timeouts to mask race conditions

If a proper fix is too expensive right now, **explicitly defer it as a tracked task** in POLISH_PASS or PROJECT_STATUS. Never hide the deferral.

### Rule 4 — Bash safety: no compound `&&`

Each command runs as its own bash invocation. This is a hard rule because of Windows shell quirks in Paata's environment.

❌ `cd /repo && npm install && npm test`
✅ Three separate commands, each in its own tool call

This applies to Claude Code only — chat-Claude doesn't run bash.

### Rule 5 — Verify state before destructive actions

Before any of the following, explicitly confirm current state:
- DNS changes
- File or directory deletions
- Edge Function deletions or redeploys to production
- Provisioning profile or credentials operations
- Anything that affects the live xprohub.com domain

"Trust but verify" — even when chat-Claude is confident, ask Paata to screenshot or describe the current state. Once today, an "Apple Save" looked like it persisted but didn't — only verification caught it.

### Rule 6 — Consult Claude Code on ground-truth questions

Chat-Claude reasons from docs, history, and pattern recognition. Claude Code has direct access to the file system, the CLI, the live database, and the build environment. When a decision depends on the actual current state of any of those — not what the docs say, not what's "usually" true, not what the pattern suggests — consult Claude Code before proposing a path.

Examples of ground-truth questions:
- "What will this CLI command actually do against our project right now?"
- "Is this column actually in the live DB?"
- "Did this file save correctly to disk?"
- "What's the actual state of this Edge Function deployment?"
- "Has this migration been applied?"

Examples of NOT ground-truth questions (chat-Claude can answer directly):
- "Should the gate fire at Submit or Load?"
- "Which Stripe object handles this case?"
- "Is this design consistent with our locked decisions?"

This rule was earned the hard way on 2026-05-12 during Chunk D-1. Chat-Claude initially recommended `supabase db push` based on docs and pattern recognition. Paata pushed back and asked to consult Claude Code. Claude Code surfaced that the migration tracking table was empty — meaning `db push` would have tried to re-run all 9 existing migrations against production. Catching this required ground-truth access chat-Claude didn't have.

When in doubt about whether a question is ground-truth: it probably is. The cost of asking Claude Code is low. The cost of proceeding on incomplete information against a live production DB is high.

---

## Three-way team patterns

### chat-Claude's role

- Strategy, architecture, decision framing
- Reviewing Claude Code's investigation output
- Drafting OLD/NEW proposals
- Writing the verbatim prompts Paata copy-pastes to Claude Code
- Pacing checks at natural breakpoints
- Documentation drafts (commit messages, PROJECT_STATUS entries, POLISH_PASS items)
- Never executes code directly

### Claude Code's role

- Reading files, citing line numbers
- Running bash, executing builds
- Applying file changes after approval
- Web-fetching docs when researching
- Reporting output verbatim back to Paata
- Honest reporting of warnings, errors, surprises
- Flagging when chat-Claude's instructions don't match canonical docs (Claude Code caught Locked Decision drift in our last session — that catch saved us)

### Paata's role

- The decider on every architectural and strategic choice
- The copy-paste bridge between chat-Claude and Claude Code
- The empirical validator (iPhone tests, screenshots, real-world checks)
- The pace-setter (calls breaks, decides session boundaries)
- The keeper of credentials, secrets, Apple Developer access, Stripe dashboard

### Prompt format Claude Code expects

When Paata pastes a prompt from chat-Claude, it should look operational:

- Clear sequence of steps
- Specific commands with full paths where relevant
- "Stop after step N" markers
- Expected output described, so verification is explicit
- No assumed context — IDs and paths repeated even when "obvious"

Claude Code should not improvise beyond the prompt. If the prompt says "stop after step 4," stop after step 4. If unsure whether step 5 is implied, ask.

### Division of responsibility in prompts

chat-Claude defines WHAT to build. Claude Code drafts HOW to build it.

**Define behavior, not code.** Tell Claude Code what a function should do (inputs, outputs, error cases, security model). Do not write full file content — chat-Claude can't see existing codebase patterns and will introduce deviations. Instead: "Draft the Edge Function per the design doc. Match the pattern from create-stripe-account." Claude Code drafts, chat-Claude reviews.

**Ask before prescribing deploy/infrastructure commands.** Before writing exact CLI commands (deploy, config changes, flags), ask Claude Code: "What deploy steps does this function need? Check config.toml and report." chat-Claude cannot see config.toml, deno.json, or other infrastructure files.

**Strategy consultations before new integrations.** Before writing code for a new Stripe integration, new screen, or new Edge Function, ask Claude Code judgment questions first. The D-2 strategy consultation caught the missing EphemeralKey requirement before any code was written.

**Include infrastructure in build sequences.** Design docs with build steps must include config file updates as explicit steps. For a new Edge Function: index.ts, per-function deno.json, config.toml entry (verify_jwt, import_map, entrypoint), deploy command. These are required steps, not optional details.

### chat-Claude's blind spots

chat-Claude cannot verify:

- Existing code patterns (import style, module-level vs per-request clients, error response shape)
- Config file state (config.toml, deno.json, app.json current values)
- What's deployed vs what's committed
- Whether a column/table actually exists in the live DB right now

For any of these, ask Claude Code to check rather than assuming. (See also Rule 6.)

### The handoff template

When chat-Claude is ready for Claude Code to build something:

    Build [STEP ID]: [name]

    WHAT IT DOES:
    [2-3 sentences on behavior, inputs, outputs]

    DESIGN REFERENCE:
    [doc path and relevant section]

    PATTERN TO FOLLOW:
    [name the closest existing file to mirror]

    CONSTRAINTS:
    [security model, error handling rules, naming conventions]

    Draft the code, show me for review. Do NOT save yet.

### Good vs bad prompts

**Good — specific, self-contained, verifiable:**

> Read app/(tabs)/apply.tsx lines 1-50. Look at the existing gate logic.
> Context: The apply gate currently checks Stripe status but not photo + skills.
> Task: Add a load-time guard that queries the user's profile for avatar_url and counts their worker_skills rows.
> Constraints: Import SafeAreaView from 'react-native-safe-area-context'. Background #0E0E0F.
> Verify: npx tsc --noEmit should show 0 errors. Stop before committing.

**Bad — assumes shared context:**

> Add the ID gate we discussed to the apply screen.

Claude Code wasn't in the discussion. It doesn't know what "the ID gate we discussed" means, which file, or what the gate checks.

### Common prompt mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| "Fix the bug we found" | Claude Code wasn't there | Describe the bug, the file, the line |
| "Use the same pattern" | No shared memory | Name the file that has the pattern |
| Chaining 5+ changes | Scope creep | One focused change per prompt |
| No file path | Claude Code guesses | Always include the exact path |
| No verification step | Silent failures | Include tsc/deno check |
| Full file content in prompt | Pattern deviations | Define behavior, let Claude Code draft |

---

## Slice-based work

Big tasks are broken into small reviewable slices. Each slice:

- Is atomic — landing it doesn't require landing others
- Is verifiable — has a clear "did it work" check
- Has its own approval gate
- Often sits in working tree uncommitted, accumulating with other slices

Example from Task 5 (iOS Universal Links):
- Slice 1: app.json associatedDomains (uncommitted)
- Slice 2: /web folder content (committed early because Cloudflare needed it on GitHub)
- Slice 6: Edge Function URL change (uncommitted, waited for empirical proof)
- Slice 7: Edge Function deploy (live runtime change, separate from code)
- Slice 11: Cold-start `<Redirect>` fix (uncommitted)
- Slice 13: stripe-redirect Edge Function deletion
- Final commit: all slices together once empirical iPhone test passed

This pattern lets us preserve atomicity at commit time without preventing parallel work.

---

## Decision-making patterns

### Use `ask_user_input_v0` for any meaningful choice

chat-Claude doesn't unilaterally decide:
- Architectural directions
- Trade-off resolutions
- Whether to defer vs fix-now
- Commit structure
- Naming conventions

For each, ask Paata explicitly. Present options, name your recommendation, explain reasoning. Then wait.

### "Your call" / "your judgment" = delegated authority

When Paata says "your call" or "your judgment" or similar, it means:
- He trusts your reasoning
- He's signing off without re-litigating
- You should still explain what you picked and why
- He may push back on the explanation, which is fine

Don't interpret "your call" as "skip the reasoning." Always show the work.

### Pacing checks at natural breakpoints

Long sessions degrade Claude quality. At natural breakpoints (commit boundaries, EAS build starts, after empirical validation), ask:
- "Want to push through, or take a break?"
- "Finish today, or save for next session?"

The breakpoint matters more than the activity. After a commit pushes, before another investigation starts — that's a good moment to check pacing.

---

## Documentation patterns

### Commit messages tell the story

Long commit messages are not bloat — they're the only persistent record of intent. Future-Claude reading `git log` should learn:
- What changed (code-level)
- Why it changed (architectural reasoning)
- What was empirically validated
- What's deliberately deferred

Example structure (from Task 5):
1. One-line subject (`feat: Task X — brief description`)
2. Paragraph framing
3. "Code changes" section (file-by-file)
4. "Infrastructure changes outside the repo" section (state changes not visible in diff)
5. "Empirical validation" section (proof it works)
6. Closing line ("Task X closes" or similar)

### PROJECT_STATUS is the canonical task tracker

When a task closes, update PROJECT_STATUS in the same commit. Don't let docs drift from code.

When a task is queued, add a section to PROJECT_STATUS. Don't keep it in chat-only memory.

### POLISH_PASS captures discovered issues

If we discover something during a task that's not in scope but worth tracking — log it in POLISH_PASS. Examples from Task 5:
- Expo SDK patch versions out of date (4 packages)
- hello@xprohub.com email routing not yet wired
- Workers subdomain stub created accidentally during Cloudflare setup

Don't let discoveries die in chat history. They go in the doc.

### CLAUDE.md is for stable conventions

CLAUDE.md changes rarely. It's for project-level facts that don't fluctuate:
- Code style
- File organization conventions
- Mission framing
- Shared vocabulary

Don't update CLAUDE.md mid-task. If you find a convention shift is needed, propose it as its own small task.

---

## Anti-patterns we reject

- **Silent assumptions:** "I'll just assume the column exists" — no, verify.
- **Compound bash:** `&&` chains in Windows environment — no, separate calls.
- **Pre-commit confidence:** "This should work, let's commit" — no, empirically validate.
- **Trust-without-verify:** "Apple said it saved" — no, refresh and check.
- **Auto-fix from investigation:** Claude Code finding a bug ≠ Claude Code fixing it — investigation is read-only.
- **Locked Decision drift:** Adding something to HANDOFF that isn't in PROJECT_STATUS — catch the drift, demote the decision.
- **"Just one more thing":** End sessions cleanly at natural breakpoints. Scope creep at hour 10 is how mistakes happen.
- **Pretending to remember:** New Claude instances don't have continuity. Be honest. The docs are the continuity.

---

## When things go wrong

We hit several "things going wrong" moments today. The pattern that worked:

1. **Surface the failure honestly** — don't paper over it. Claude Code flagging the "provisioning profile mismatch" was the right move.
2. **Diagnose before fixing** — "what actually went wrong?" before "how do I fix it?"
3. **Verify the fix worked** — re-run the failing case. We didn't trust the fix until the second EAS build succeeded AND the cold-start test passed.
4. **Capture the learning** — add a POLISH_PASS entry, or update the relevant doc, or both.

When something fails, the failure itself is information. Treat it as such.

---

## Session start checklist

For any new chat-Claude session, the first 10 minutes should include:

1. Read HANDOFF.md
2. Read CLAUDE.md
3. Read this file (WORKING_GUIDELINES.md)
4. Read PROJECT_STATUS_2026-05-03.md
5. Read POLISH_PASS.md
6. Run `git log --oneline -10`
7. Summarize back to Paata what you understand
8. Ask what we're tackling

For any new Claude Code session, the first 5 minutes:

1. Read CLAUDE.md (auto-read)
2. Read HANDOFF.md
3. Read this file
4. `git log --oneline -10`
5. `git status` (confirm clean tree, or note uncommitted state)
6. Wait for instructions

---

## Closing principle

These guidelines aren't constraints — they're scaffolding. They let us go fast safely. The rigor compounds: a clean commit history makes the next session faster, an honest POLISH_PASS prevents technical debt, an accurate PROJECT_STATUS means we don't relitigate settled questions.

The work is the work. These rules are how we do it without losing the thread.
