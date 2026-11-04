# Authentication UI and route protection

This phase uses the existing Better Auth 1.7.15 instance, MongoDB adapter, JWT plugin, and browser auth client. It adds no duplicate auth configuration, environment changes, dependencies, schemas, or Express business operations.

## Pages

| URL | Access | Behavior |
| --- | --- | --- |
| `/login` | Public | React Hook Form/Zod email/password login, supported remember-me option, password visibility, Google button, loading/error states, and Sonner feedback. |
| `/register` | Public | Name, email, password, matching confirmation, server-aligned password policy, and Better Auth sign-up. |
| `/profile` | Private | Read-only name, email, image/initials, member-since date, and account information from a verified session. |
| `/add-book` | Private | Authenticated placeholder; no book mutation. |
| `/my-books` | Private | Authenticated placeholder; no management operations. |
| `/my-borrows` | Private | Authenticated placeholder; no borrow operations. |
| `/books/[id]` | Private | Authenticated placeholder; no details API call or borrowing. |
| `/books` | Public | Catalog landing placeholder linking to the existing homepage arrivals; full catalog functionality is deferred. |

The homepage layout, assets, colors, card grids, and sections are unchanged. Its prerender fallback CTA now uses Next Link instead of a plain anchor because the newly created `/books` page activates the corresponding lint rule.

## Authentication behavior

`AuthForm` calls the existing `authClient.signIn.email`, `authClient.signUp.email`, and `authClient.signIn.social`. Better Auth handles cookies and session storage; no passwords or auth tokens are manually persisted in localStorage. Registration automatically signs in through the existing configuration. Successful email/password flows use `router.replace` with a validated callback destination and refresh server content. Login/Register links preserve that destination between forms.

The password rules are shared through `src/lib/password-policy.js`: at least six characters, uppercase, and lowercase. Existing server validation delegates to the same predicate; its behavior is preserved. Forms also apply the library's default maximum of 128 characters. Confirmation is checked locally and never sent as a user field. Profile images use the existing Better Auth `image` field; no new database fields or editing are added.

Google availability comes from the existing server auth options as a boolean, never credential values. If absent, the button is disabled with an explanatory message. If configured, it invokes Better Auth's social method with the safe callback. Google credentials/consent screen must still be validated manually; this task did not run a real Google OAuth flow. No verification or password-reset pages/links were added.

Errors use fixed UI messages instead of reflecting arbitrary server/network text. Failed login/registration keeps the form available for retry. Failed logout leaves the user on the current page with error feedback. Successful logout calls Better Auth sign-out, closes mobile navigation, replaces the current URL with `/`, and refreshes server content.

## Navbar

The navbar keeps the existing appearance, theme toggle, and mobile Sheet. It uses `authClient.useSession()`:

- Anonymous: Home, All Books, Login, and Register.
- Authenticated: Home, All Books, Add Book, My Books, My Borrows, avatar, and account dropdown.
- Dropdown: user name/email, My Profile, My Books, My Borrows, and Logout.
- Initial session check: skeleton controls; no private links or premature auth buttons.
- Background session refresh with a known user keeps navigation stable.

Mobile links follow the same state. Active navigation follows the current path. A Suspense boundary handles the installed Next.js cache-components requirements for `usePathname()` on dynamic routes.

## Server protection and callbacks

Every private page invokes `requireSession()` through a server component. The `(member)` layout supplies presentation only; it does not serve as the sole authorization check. A missing cookie redirects immediately; a present cookie is verified using Better Auth's server API with cookie-cache bypass and the shared MongoDB connection. Forged, invalid, expired, or logged-out sessions cannot grant access. Database failures fail closed into the member error boundary.

The group loading boundary streams a neutral loading state while Next reads request headers and verifies the session. Personalized profile data is not put into a shared cache. A full request/refresh to a private route checks authentication again. This follows the [Better Auth Next.js server API integration](https://better-auth.com/docs/integrations/next); no cookie-only proxy is used as a security boundary.

Anonymous requests redirect to `/login?callbackURL=...`, preserving the path and supported query parameters. `safeCallbackURL` only accepts local absolute paths and rejects external/scheme-relative URLs, backslashes, controls, nested encoded bypasses, malformed encoding, and auth/API route loops. Absent/unsafe callbacks use `/`. Repeated callback parameters also fall back to `/`.

Frontend route protection does not authorize Express operations. The existing reusable jose JWT middleware remains the API enforcement mechanism for future protected operations. No currently public API was restricted, and the deferred private details API remains unmounted.

## Files added

- `src/app/login/page.js`, `src/app/register/page.js`, and `src/app/books/page.js`.
- `src/app/(member)/layout.js`, `loading.js`, `error.jsx`, and pages for add-book, my-books, my-borrows, profile, and books/[id].
- `src/components/auth/AuthForm.jsx`, `AuthPage.jsx`, `PageShell.jsx`, `UserAvatar.jsx`, and `ProtectedPlaceholder.jsx`.
- `src/lib/auth-ui/schemas.js`, `redirects.js`, `actions.js`, `navigation.js`, and `session-guard.js`.
- `src/lib/password-policy.js` and `src/lib/session.js`.
- `src/app/auth.css` and `test/auth-ui.test.js`.

Modified: `src/components/home/Navbar.jsx`, `src/lib/auth-options.js`, `src/app/globals.css`, and the homepage fallback Link in `src/app/page.js`. No `.env` or package files were modified.

## Verification

```sh
# booknook-client
node --test
npm run lint
npm run build

# booknook-server
node --test
```

The client suite includes form validation/confirmation, safe callback cases, pending/anonymous/authenticated navbar models, auth action mapping, safe error messages, logout, and a real Better Auth in-memory session guard test. The guard test rejects missing/forged/logged-out sessions and accepts a verified session. Existing auth and books API tests remain included. No Atlas user accounts are created by these tests.

Browser checks cover form errors, password visibility, preserved callbacks, anonymous redirects for every private page, query-string preservation, desktop/mobile layouts, authenticated dropdown navigation, and logout. Authenticated UI and successful login browser checks use temporary intercepted responses; they do not bypass server guards or create database records. Real anonymous route protection is exercised against the local Next.js server. All temporary request interception is cleared afterward. Google OAuth remains unverified.

Final results: **31 client tests passed, 33 server tests passed, client ESLint passed, and production build passed**. The live existing Express health and Books listing endpoints also returned HTTP 200. Login/Register had no horizontal overflow at 320px; the reviewed desktop login uses the same BookNook styling. A fresh local-server check reported no new browser render errors. Direct Node tests retain the existing module-detection warning because the client package does not declare an ESM type; no package configuration changes were needed.
