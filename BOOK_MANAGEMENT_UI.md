# Book Management frontend

The three protected pages now call the existing Express Book APIs. The four images in image/ were reviewed as layout ideas. Per the user's clarification, their green colors/theme were not copied: pages reuse BookNook's existing blue/white and dark-mode palette, Navbar, Footer, theme toggle, and Sonner. Homepage and Login/Register appearance remain unchanged.

## Pages and contracts

- /add-book: server-verified session; compact React Hook Form/Zod form. Only title, author, category, image, description, totalCopies are sent to POST /books. Readonly name/email come from the session. Successful creation navigates to /books/{returned _id}. A submission lock and disabled fieldset prevent duplicate submissions.
- /my-books: GET /books?mine=true&page=N&limit=10, never a public fetch followed by client ownership filtering. Includes skeleton, empty/error/retry states and pagination. The edit dialog prefills the six editable fields and PATCHes the selected ID. The accessible Base UI confirmation dialog can cancel deletion; DELETE refreshes the list and backs up one page when necessary. HTTP 409 leaves the dialog open with a safe conflict explanation. Owner identity/available copies are never editable.
- /books/[id]: server-verified session followed by authenticated GET /books/:id. Shows cover, descriptive/owner fields and inventory; loading, not-found, retry and error states. Zero availability disables borrowing; otherwise the button only shows a coming-next notification. It performs no borrowing request or inventory adjustment.

Pages moved from (member) into (book-management) solely to scope shared presentation. Every page still calls requireSession before rendering private content, preserves login callbacks, and sits under a loading/Suspense boundary compatible with installed Next.js Cache Components. No session data is cached across users. Profile and My Borrows remain in the existing member group.

## API and image handling

The existing NEXT_PUBLIC_API_URL setting and localhost:5000 development fallback are shared through src/lib/api/url.js. Existing homepage fetches use that URL utility with unchanged query/mapping behavior.

The existing authClient with jwtClient is reused. src/lib/books/api.js calls authClient.token(), using its standard fetchOptions signal, once per operation; src/lib/api/authenticated-request.js attaches Bearer auth to Express requests with no-store, a 15-second timeout, and cancellation. It does not manually persist tokens/passwords or automatically replay mutations. A new operation obtains a fresh token, so an expired JWT is not retained. HTTP 400/401/403/404/409/429 and infrastructure failures use fixed messages without raw server responses. A 401 redirects safely back to login with the current internal destination.

The supported token API was verified in the installed Better Auth 1.7.15 plugin/client and [official JWT documentation](https://better-auth.com/docs/plugins/jwt).

Image inputs are text URLs, validated as HTTP(S), max 2048 characters, without embedded credentials. A live native image preview uses no-referrer and a readable icon fallback if loading fails. Editing can replace the URL. There are no file inputs, uploads, image hosting keys, hosting packages, or new endpoints. The browser loads the user's chosen URL directly; Express does not fetch image URLs.

Validation follows the backend limits: title 1–300, author 1–200, description 1–5000 trimmed characters; exact five categories; positive safe-integer copies. Server validation/ownership/inventory rules remain authoritative.

## Files created or moved

- src/app/(book-management)/layout.js, loading.js, error.jsx, books.css
- src/app/(book-management)/add-book/page.js (replaces member placeholder)
- src/app/(book-management)/my-books/page.js (replaces member placeholder)
- src/app/(book-management)/books/[id]/page.js (replaces member placeholder)
- src/components/books/AddBook.jsx, BookForm.jsx, MyBooks.jsx, BookDetails.jsx
- src/components/books/BookCover.jsx, BookStates.jsx, useBookResource.js
- src/lib/api/url.js, authenticated-request.js
- src/lib/books/api.js, schema.js
- test/book-management.test.js
- BOOK_MANAGEMENT_UI.md

Modified: src/lib/home/books-api.js (shared URL extraction), AUTH_UI.md (page status and location).

No backend code, package manifests/lockfiles, actual environment files, Homepage components/styles, or Login/Register components/styles were changed by this task. No dependencies or commits were added. The user-provided image/ directory was left untouched.

## Verification

Run node --test, npm run lint, npm run build from booknook-client.

- 41 client tests passed, 0 failed, including the 10 new form/API tests and existing auth/home regressions.
- ESLint and production build passed. The final build contains no test harness route.
- Anonymous local HTTP checks for all three actual pages confirmed streamed Next.js login redirects with their callback paths (HTTP 200 streamed responses, not claimed as HTTP 302).
- Isolated headless Edge browser checks rendered the actual components using a temporary harness and mocked auth/Express/image responses. Required-field validation, valid preview, broken-image fallback, single create/allowlisted payload, mine=true requests, edit/prefill/image replacement, selected-ID PATCH, delete confirmation/cancel/409/success, empty/error/retry states, details owner data, zero-copy disabled state and 390px no-overflow check passed. Desktop checked at 1280px. Screenshots were inspected. The temporary route was removed and the isolated browser closed. No production auth bypass is retained.
- A real Atlas mutation, authenticated production session, real Google OAuth, or production deployment was not tested. No fake records were written to MongoDB.
- The in-app browser connector was unavailable; the existing Edge installation was used without installing browser packages.
- The existing Node module-detection warning remains because the client package does not declare type:module; tests pass without changing package configuration.

Remaining: real-account end-to-end acceptance against Atlas is still manual. /books remains the previously deferred public catalog placeholder; full catalog and all Borrow functionality are outside this task.
