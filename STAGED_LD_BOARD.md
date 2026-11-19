# Local staging: L&D board, 19 Nov 2026

Local worktree only: `/workspace/obhg-triage-ld-board-2026-11-19`, branch `ld-board-2026-11-19`, from live main `8481aea`. **Nothing was pushed.** This is not a live release. Michael's go is required before any push.

## What was added

- New start-page tile **L&D board** opens `board.html` (same pattern as Nurse).
- Site-config driven (`js/ld-board-sites.js`): `siteName`, `rooms`, optional `antepartumRooms`, and `checklist` for labor / postpartum / antepartum. Included sites: CHRISTUS St. Michael and Demo Regional.
- Board state is stored in **IndexedDB** (`obhg-ld-board`) on this device only. No server. Auto-purge 24 hours after the last save. Patient data leaves the device only through the user's own Share or file save.
- **Share board** (after confirm) uses the Web Share API with a JSON file when the device supports it, otherwise downloads the file. **Load shared board** imports that file.
- Disclaimer, verbatim, next to Share and again in the confirm dialog: `only use encrypted OBHG or local Hospital approved email or Bluetooth functions like iPhone AirDrop`.
- In-app fixes vs the known PDF issues (PDF renderer files were left alone): notes fields are full width; chips/check controls are not clipped; antepartum patients are not listed a second time (so initials such as NT appear once on the occupied view).
- Service worker cache: `obhg-triage-v42-2026-11-19-ldboard`. `board.html`, `css/ld-board.css`, `js/ld-board.js`, and `js/ld-board-sites.js` are precached.

No names, “reviewed by,” or draft stamps. No card codes on the board.

## Verification

- `npm test` passed: decisions identical 75/78 with the three expected routing exceptions.
- Playwright card checks: 12/12 passed on this worktree; cache name `obhg-triage-v42-2026-11-19-ldboard`.
- Playwright board checks (`tests/ld_board_browser.js`): add a room, edit, persist on reload, export, import — all passed. NT appears once on the example occupied view.

## Screenshots

- `/workspace/medical/meddir/site-director/ld-board/app-preview/iphone-390x844.png`
- `/workspace/medical/meddir/site-director/ld-board/app-preview/desktop-1280x800.png`
- Start-page companions: `iphone-390x844-start.png`, `desktop-1280x800-start.png`

## Remotes

Not pushed to `github` (`mcarozzamd/obhg-triage`) or any other remote. `/workspace/obhg-triage-app-deploy.sh` was not run.
