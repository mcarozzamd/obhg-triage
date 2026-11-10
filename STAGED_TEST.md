# OBHG TRIAGE — LOCAL STAGED TEST

**LOCAL ONLY. NOT APPROVED FOR PUBLICATION. USE SYNTHETIC DATA ONLY.**

Branch: `staged-closeout-20261109`, based on `addbd91`.
Worktree: `/workspace/obhg-staged-closeout-20261109`.
No push, deployment script, GitHub changes, or public hosting was performed.

## TRY IT

The box-local server is running at **http://127.0.0.1:8879/**. Open this URL in a browser **on the box**, not on Michael's phone; phone localhost points to the phone, not the box. This origin has its own storage, separate from the live app. The browser test uses a disposable profile, so the normal box browser starts empty.

1. Shift log → save a synthetic provider profile.
2. Add synthetic entries with e.g. `Admitted antepartum`, `Observation`, and `Discharged home` dispositions.
3. Under THIS SHIFT, find the card for each active row. Type an update (or use the phone keyboard's dictation, when eventually testing on a phone), then append it. The note is timestamped `HH:MM CT update:` and retained separately from Plan.
4. Open the row's clinical lookup. Enter an optional clinical question, preview, and confirm that no identifiers appear. Grok receives the reviewed query in `?q=`. OpenEvidence copies the query and opens its homepage for pasting; manual copy is offered if clipboard access fails.
5. Shift closeout → review open dispositions, change carry-over selections, then Finalize + export PDF. Admitted rows are preselected; Observation, To OR, Other, and unknown dispositions require explicit selection. Discharged/transferred/voided rows are not candidates. Save drafts first.
6. The old shift is saved under Past shifts and a new empty shift opens. Bring carry-overs into this shift → review/import selected. Re-importing the same source row is prevented. Original notes and provenance are retained.
7. Export/share the existing PDF. Full update notes appear beneath their row without changing the 11 columns. If OS sharing is canceled, the finalized shift stays saved and can be exported again from Past shifts.

Pending carry-overs are stored atomically inside the source shift in `shiftlog_logs`; retention/purging the source also removes its unimported queue. Imports are explicit, never automatic. `Start new shift` and automatic 08:00 rollover remain available and unchanged; use closeout to prepare a carry-over queue.

To restart the server:

```sh
python3 -u -m http.server 8879 --bind 127.0.0.1 --directory /workspace/obhg-staged-closeout-20261109
```

A phone-reachable link would need separately approved hosting (e.g. a distinct staging repository/site) or a temporary authenticated tunnel. Neither was created.

## TESTS

```sh
npm ci
npx playwright install chromium
npm test
# With the local HTTP server running:
npm run smoke
# Original October expectations, including two already-known failures:
TZ=America/Chicago node tests/legacy-engine.cjs
```

Set `ARTIFACTS` to choose output directory (default: ignored `test-results/`). Set `STAGING_URL` to override the smoke URL. Regression comparisons read the `addbd91` baseline from local git history, with no network access.

Latest results: **48 new unit tests pass, all 33 prior regression checks pass, and 24 headless Chromium phone checks pass** (390×844, America/Chicago). All 78 triage outputs match baseline exactly. The unchanged legacy clinical expectation suite remains 76/78: its two outdated fever-in-labor cases expect SYS-03, whereas the baseline and staged engine both return LND-04. These expectations were not rewritten to hide the discrepancy.

Artifacts for this run: `/workspace/staged-closeout-tests-20261109/`:
- `unit-regression-results.txt`, `legacy-engine-results.txt`, `browser-results.txt`, `browser-results.json`
- `01-update-phone.png`, `02-lookup-phone.png`, `03-closeout-phone.png`, `04-carryover-phone.png`, `05-imported-phone.png`
- `updated-shift.pdf`, `finalized-shift.pdf`, `updated-shift-page.png`, `synthetic-log.pdf`

External navigation, clipboard denial, native share success/cancel, and privacy controls were tested with mocks. No clinical query or PDF was actually sent externally. Actual iPhone dictation/native share, OpenEvidence paste/sign-in, and Grok's handling of `?q=` still need device/site acceptance testing. No working OpenEvidence URL prefill parameter was assumed. Pattern checks are conservative, not a complete anonymizer; explicit human review is mandatory.

## PARALLEL CARD JOB

While this isolated branch was being tested, the original checkout advanced independently to `126944b` (card batch; changes `js/content.js`, `sw.js`). This staged branch intentionally remains based on `addbd91`; no card, diagram, code table, or PDF asset was edited here. Any later approved integration must preserve that card job and reconcile the shared service-worker version; do not overwrite its content or deploy either branch blindly. The staged cache is `obhg-triage-v22-2026-11-09-staged-closeout`.
