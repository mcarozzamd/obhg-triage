# OBHG TRIAGE — TESTING AND SOURCE-PLAN NOTES

Live app: https://mcarozzamd.github.io/obhg-triage/
Local worktree: `/workspace/obhg-staged-closeout-20261109`.
Local-only QA server: `http://127.0.0.1:8879/` (open on the box; not phone-reachable).
Use synthetic data in test browsers. Automated tests use fresh disposable profiles and never send a clinical query or PDF externally.

## SHIFT LOG CONTROLS

- **Close shift log** lists open dispositions and preselects admitted patients as carry-overs. Review the selections, then finalize/export the existing PDF. The finalized log stays under Past shifts; a new empty log opens.
- **Start new shift log** retains the original close/start behavior. Use Close shift log to prepare carry-overs; automatic 08:00 rollover is unchanged.
- **Bring carry-overs into this shift** imports selected queued rows only on demand. Each source row can import once. Notes and provenance are retained. Purging/retention of a source shift removes its unimported queue.
- Each active row has an update box (typing or native keyboard dictation). Updates are timestamped in America/Chicago and stored separately from the 240-character Plan; full notes are included in PDFs.

## NOVEMBER 10 FIXES

1. Leading 2–3 uppercase initials support whitespace and dictation punctuation, not just an age immediately afterward. Title-case tokens require demographics, so pronouns/names are not guessed as initials. Explicit “Initials:” is supported. Initials at the start of structured HPI also auto-fill; manual edits are protected.
2. Source-plan extraction handles attributed list items, headings, tables, standalone action paragraphs, and all action lines (no arbitrary 12-item cutoff). Companion cards are resolved generally. The existing SYS-03 and ED→OB diagrams have no companion card text in CONTENT, so `js/flowplans.js` provides verbatim, hash-checked references extracted from those already-published PDFs—not new clinical recommendations.
3. Labels are Close shift log and Start new shift log; matching help/prompts/tests are updated.
4. Clipboard payload and Grok URL are separate values. Readable clinical text is copied before opening OpenEvidence, with synchronous iPhone-compatible copy first, async Clipboard API fallback, a separate Copy plain query button, and manual-copy recovery. Accidentally percent-encoded inputs are decoded before privacy validation and preview. Only the Grok URL is encoded.
5. The red test banner is removed. Cache version: `obhg-triage-v23-2026-11-10-fixes`; the existing shift-log storage keys/schema are retained.

All 64 content entries are audited (42 cards, 22 flows). Two matched flow paths previously had empty PLAN sections (SYS-03 and ED→OB); all 64 now populate. Additional previously omitted action text is recovered in 41 entries. Original clinical assets/content/code tables remain unchanged.

The two newly available flow transcripts contain alternative branches, not simultaneous orders. They are explicitly labeled as source references. Clinicians must select applicable actions; the short Plan is not automatically populated from that conditional reference. This preserves its previous empty short-Plan behavior without turning mutually exclusive branches into a treatment list. Other matched-card short Plan extraction remains unchanged.

Source PDF SHA-256 values:
- SYS-03: `4b875966b2a93e0d6e2915c06b2bebc695431800d1077f947c8000edc18493ef`
- ED→OB: `1cd746ab11977558741d382d9ab21f413549dcc78b8d930173b7d72a8b400265`

Every reference text block is checked against extracted PDF text (whitespace and superscript typography normalized). Existing pharmacy-verification warnings remain. The held card batch `126944b` is not included; preserve it separately and reconcile sw.js during any later approved integration.

## REPRODUCE CHECKS

```sh
npm ci
npx playwright install chromium
npm test
# With the local server running:
npm run smoke
npm run smoke:fixes
# Against deployed site, read-only with synthetic local storage and mocked lookups:
TARGET_URL=https://mcarozzamd.github.io/obhg-triage/ RUN_LABEL=live npm run smoke:fixes
```

`ARTIFACTS` chooses output directory (default ignored `test-results/`). `STAGING_URL` overrides the main smoke URL. `TARGET_URL` and `RUN_LABEL` control the targeted fixes smoke. No test publishes or sends external messages.

The unchanged original October clinical expectation script still contains two known stale SYS-03 expectations (actual baseline LND-04). Its historical 76/78 result is not hidden or rewritten. The supported regression suite verifies that all 78 full engine outputs remain identical to the approved baseline.

On a phone, open while online and tap Reload when prompted; a second refresh/reopen may be necessary for service-worker activation. Do not clear website data/localStorage: shift logs are stored there. Actual physical iPhone dictation/clipboard acceptance still merits user confirmation; automated checks use Chromium with controlled clipboard/navigation mocks, not a real iPhone.
