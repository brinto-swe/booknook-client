# Borrow Management UI

The Book Details Borrow action opens the existing accessible dialog with readonly session name/email and a seven-day notice. Only `bookId` is sent to Express. The server supplies the due date and inventory; successful mutations reload authoritative data.

My Borrows is protected by the existing server session guard and calls `GET /borrows?page=1&limit=10` with a fresh Better Auth JWT. The server determines the borrower. Active and returned records are retained; dates use UTC consistently. `DELETE /borrows/:id` means return, not history deletion. Return confirmations lock during submission, and successful/already-completed returns refresh the history.

The shared authenticated request helper handles timeouts, cancellation and fresh JWT retrieval. Borrow errors use fixed messages for allowlisted error codes; raw server diagnostics are never rendered. Failed mutations are never automatically retried.

## Verification

From booknook-client:

- `node --test` — existing regression checks plus Borrow payload, pagination, errors, authentication, dates and synchronous submission-lock tests.
- `npm run lint`
- `npm run build`
- With the development server running at localhost:3000: `node scripts/check-borrows-ui.mjs`.

The browser check uses installed headless Microsoft Edge and its debugging port 9335. Set `BOOKNOOK_BROWSER_BIN` to use another Chromium executable. It creates a temporary component harness with exclusive file creation, intercepts Books/Borrow/auth responses, exercises the real components, and removes the temporary route in a finally block. Do not run it during a production build. Screenshots go to the system temporary directory, or `BOOKNOOK_UI_OUTPUT` when supplied. No test records are written to MongoDB. The browser check requires a free debugging port and is separate from the Node unit suite.

Covered browser scenarios: modal open/cancel and readonly identity, safe API failure/retry, insufficient availability, duplicate active loan, busy controls and double-click prevention, successful borrowing and server inventory refresh, history skeleton/data/dates, return confirmation/cancel/success, retained returned history, duplicate return prevention, already-returned conflict, empty/error/retry and mobile overflow.

These mocked browser checks do not establish a real authenticated Atlas end-to-end borrow/return result.

## Files changed

Created:
- `src/components/borrows/BorrowAction.jsx`
- `src/components/borrows/BorrowDialog.jsx`
- `src/components/borrows/MyBorrows.jsx`
- `src/components/borrows/borrows.css`
- `src/lib/borrows/api.js`
- `src/lib/borrows/core.js`
- `src/lib/api/client.js`
- `test/borrows.test.js`
- `scripts/check-borrows-ui.mjs`
- `BORROW_MANAGEMENT_UI.md`

Modified:
- `src/app/(book-management)/books/[id]/page.js` — passes only verified display identity.
- `src/components/books/BookDetails.jsx` — replaces the Borrow placeholder.
- `src/app/(member)/my-borrows/page.js` — guards and renders real history.
- `src/components/ui/dialog.jsx` — optional overlay class, preserving defaults.
- `src/lib/api/authenticated-request.js` — allowlisted safe error codes.
- `src/lib/api/url.js` — enables the existing Borrow endpoint family.
- `src/lib/books/api.js` — reuses the extracted authenticated request singleton.

Verification on completion: 53 Node tests passed, 0 failed, 0 skipped; mocked browser regression check passed; anonymous route redirects checked; ESLint, production build, JavaScript syntax checks and git diff whitespace checks passed. The temporary UI test route is absent from the production route list. Existing Node module-type warnings remain; no package configuration was changed. Backend and environment files were unchanged. Real Atlas borrow/return end-to-end verification remains pending.
