# Reference homepage implementation

The attached BookNook screenshot is the visual reference. Only the homepage is implemented in this change; authentication, other pages, and backend behavior are outside its scope.

## Files and components

- Modified `src/app/page.js`, `src/app/layout.js`, and `src/app/globals.css`.
- Added `src/app/home.css` for the reference layout and responsive styles.
- Added `src/components/home/`: Navbar, HeroSlider, NewArrivals, BookCard, BorrowingSteps, Categories, Testimonials, Footer, Brand, and Providers.
- Added `src/lib/home/books-api.js` and the removable `src/lib/home/preview-books.js` dataset.
- Added local imagery in `public/assets/home/`.

The installed shadcn Sheet, Button, Card, Badge, Skeleton, and Sonner components are reused. Swiper is used only in the three-slide hero. New Arrivals and Top Categories are CSS grids. No dependencies or package scripts were changed by this task; package changes present before the task were preserved.

## API and preview behavior

Set the public `NEXT_PUBLIC_API_URL` to the Express origin for deployment. Its local default is `http://localhost:5000`. The browser requests `GET /books?limit=6`; the existing backend supplies newest-first ordering. The client consumes `{ success: true, data: { books: [...] } }`, validates the expected display fields, and displays at most six records. No database writes or seeds occur.

Loading shows six skeleton cards. A valid empty response shows the six local preview records with a visible preview notice. An unavailable/malformed response or eight-second timeout shows a separate error notice, the preview books, and a Retry action. Preview detail buttons show a toast instead of navigating with fake IDs. Valid API records link to `/books/:id`; that frontend page and its backend authentication remain future work. Missing cover images fall back to an accessible book/title graphic.

The screenshot's Self-Help badge is retained only in the isolated preview data. It does not extend the backend's five allowed categories. Remove `preview-books.js` and the corresponding fallback in NewArrivals when the catalog is populated.

Navigation and login/register links follow the supplied screenshot as presentation only. There is no authentication, session, or protected-route logic. Authentication integration must later conditionally show private links. Destination pages other than `/` are not implemented by this task. Social buttons show a coming-soon toast because official community URLs were not supplied. Contact text and the static sample testimonial follow the reference; no user accounts were created.

Swiper reads the current time internally. The hero is wrapped in Suspense to comply with the installed Next.js cache-components prerender requirements, without changing Next configuration. The footer uses the implementation year, 2026, without runtime date reads. The default theme is light; the existing next-themes package provides the theme toggle.

## Local assets and sources

The exact original source assets were not supplied separately, so cover editions and photographic details differ from the screenshot. All assets below are stored locally; runtime rendering does not rely on the source sites being available.

Book cover images are from Open Library's cover service:

| Local file | Source |
| --- | --- |
| `atomic-habits.jpg` | https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg?default=false |
| `dune.jpg` | https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg?default=false |
| `harry-potter.jpg` | https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg?default=false |
| `sapiens.jpg` | https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg?default=false |
| `hobbit.jpg` | https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg?default=false |
| `good-vibes.jpg` | https://covers.openlibrary.org/b/isbn/9781788171823-L.jpg?default=false |

Category images and the sample avatar are from Unsplash:

| Local file | Source image |
| --- | --- |
| `category-fiction.jpg` | https://images.unsplash.com/photo-1544947950-fa07a98d237f |
| `category-science.jpg` | https://images.unsplash.com/photo-1532094349884-543bc11b234d |
| `category-history.jpg` | https://images.unsplash.com/photo-1552832230-c0197dd311b5 |
| `category-kids.jpg` | https://images.unsplash.com/photo-1556012018-50c5c0da73bf |
| `category-others.jpg` | https://images.unsplash.com/photo-1495446815901-a7297e633e8d |
| `reader.jpg` | https://images.unsplash.com/photo-1494790108377-be9c29b29330 |

`hero-reading.png` was generated with the built-in image_gen tool and copied into `public/assets/home/hero-reading.png`. The final prompt was:

> Use case: stylized-concept. Generate a polished 3D illustration asset for an online library homepage hero. Subject: a large open book with cream pages resting on a stack of three thick books (deep blue, warm orange, deep blue), a green leafy plant behind it on the right, and a white ceramic coffee mug at the front right bearing exactly the words 'Read More' in navy serif type with a small blue heart below. Composition: entire arrangement fully visible, slightly three-quarter view, arranged horizontally on a subtle pale blue ground, close cropped but no cut-off objects, no other text or UI. Match a friendly high quality library landing page illustration, soft studio light, realistic paper edges, smooth rounded book spines, gentle shadows. Palette blue, orange, cream, green. Background solid very pale blue #e5eeff, not white. Aspect landscape 3:2. This will be placed on the right half of a light blue hero. No headline, no navigation, no frame.

`open-book.svg` and the inline brand mark are original code-native vector artwork. Interface icons use the installed Lucide React library; the social marks use inline SVG paths, including the X mark.

## Verification performed

- `npm run lint`: passed with no errors or warnings.
- `npm run build`: passed after adding the required Suspense boundary for Swiper; only `/` and the framework not-found route are generated.
- Mocked-fetch assertions: latest-six URL, successful data limited to six, empty data, HTTP failure, malformed record, and malformed response all passed.
- Browser layout checks at widths 320, 360, 390, 600, 768, 1000, 1024, 1280, and 1440: no horizontal page overflow; both catalog sections use CSS Grid. Desktop columns are 6/5, tablet 3/3, and mobile 2/2; books use one column at 320px.
- Visual inspection at desktop, tablet, and mobile sizes; all local images loaded. Equal card heights confirmed at mobile size.
- Hero next/pagination controls, theme toggle, mobile Sheet opening/closing, and preview toast checked in the browser.
- The existing local backend returned an empty catalog and the labeled preview appeared. Browser-only request blocking verified unavailable-API fallback and retry recovery. A temporary browser-only mock verified six populated records replace the preview notice and provide detail links; no records were inserted into the backend. All request interception and blocking were cleared afterward.

No actual `.env` file was opened or changed. No authentication, other pages, backend changes, package installations, or commits were made. Populated-catalog rendering was tested with a browser mock, not with seeded Atlas records.
