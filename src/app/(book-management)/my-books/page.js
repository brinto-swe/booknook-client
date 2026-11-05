import { requireSession } from "@/lib/session";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";
import MyBooks from "@/components/books/MyBooks";
// Fresh server session verification may block this page's navigation.
export const instant = false;
export const metadata = { title: "My Books" };
export default async function MyBooksPage({ searchParams }) {
  await requireSession(destinationWithQuery("/my-books", await searchParams));
  return <MyBooks />;
}
