# Catalog and Navigation Fixes

## Root causes and behavior

All Books was a static placeholder and never requested the existing Books API. It now uses the existing BookCard and public GET /books, with 12 records per page, Previous/Next controls, category filtering, and loading/empty/error/retry states. Category changes reset the page to 1; category links from the homepage are respected. No email, owner filter or authentication token is sent for public listing.

The homepage helper previously requested and sliced to six books. It now requests page=1&limit=30. Express already orders by addedAt descending, then ID descending; no unsupported sort parameter was added. Both views share URL building, response validation and card mapping, including image/imageUrl compatibility. Errors and malformed responses remain errors; only a genuine zero total produces the catalog empty state. No preview records are injected.

Homepage CSS retains the existing cards, gaps and colors, with five columns above 1000px, three at 601–1000px, two at 360–600px and one below 360px. The maximum of 30 books produces at most six desktop rows. All Books independently uses three desktop/tablet columns, two at 381–600px, and one at 380px or narrower.

Navbar now mounts once inside the root layout's existing providers. Home and PageShell no longer duplicate it. Authentication logic, theme switching, account menu and mobile navigation are unchanged. PageShell's remaining main/footer structure is preserved; the book layout's flex sizing accounts for the header moving outside it. Internal links already use next/link and programmatic navigation uses next/navigation. The fragment skip link remains an ordinary accessibility anchor. No internal hard reload mechanisms were found.

The private dynamic /books/[id] route is unchanged. Both catalog views generate links with the API record ID. Anonymous detail visits retain that selected destination in the existing login redirect.

## Files

Created:
- src/lib/books/public-api.js
- src/components/books/Catalog.jsx
- src/components/books/catalog.css
- test/catalog.test.js
- scripts/check-catalog-ui.mjs
- CATALOG_NAVIGATION.md

Modified:
- src/app/books/page.js
- src/app/home.css
- src/app/layout.js
- src/app/page.js
- src/app/(book-management)/books.css
- src/components/auth/PageShell.jsx (shared shell composition only)
- src/components/home/NewArrivals.jsx
- src/lib/home/books-api.js
- test/books-api.test.js (latest-30 assertions; existing scenarios retained)

## Verification

Run from booknook-client: node --test, npm run lint and npm run build. With the development server running at localhost:3000, run node scripts/check-catalog-ui.mjs and the existing node scripts/check-borrows-ui.mjs.

The new browser check uses installed headless Edge on debugging port 9336 (BOOKNOOK_BROWSER_BIN can override the executable). It mocks all API/auth responses, creates an exclusive temporary component harness and removes it in a finally block. Do not run browser checks concurrently with a production build. Optional BOOKNOOK_UI_OUTPUT selects screenshot output; otherwise the system temporary directory is used. No records are written to MongoDB.

Results: 58 Node tests passed, 0 failed, 0 skipped. Both browser checks passed. Catalog browser coverage includes a 35-record, three-page collection, filter reset and preservation, homepage category links, latest-30 cap, five homepage desktop columns, correct card IDs, fewer records, loading/empty/error/retry, three catalog desktop columns, mobile overflow, active navigation, persistent Navbar DOM identity and Link navigation with no document reloads. The existing Borrow browser regression check passed unchanged.

A separate live browser check used the actual local public Books API without mocks: HTTP 200, 12 books rendered on both homepage and catalog, matching first-book navigation. No database writes were performed. Private routes were checked for anonymous redirects; selected detail rendering was checked with mocked data through the real BookDetails component. Real authenticated Atlas end-to-end operations were not executed.

ESLint, production build, syntax and git diff whitespace checks passed. Existing Node module-type warnings remain. No backend, Borrow Management, authentication logic, environment, dependency or lockfile changes. No commits or deployment.
