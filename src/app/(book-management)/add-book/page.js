import { requireSession } from "@/lib/session";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";
import AddBook from "@/components/books/AddBook";
// Fresh server session verification may block this page's navigation.
export const instant = false;
export const metadata = { title: "Add a Book" };
export default async function AddBookPage({ searchParams }) {
  const { user } = await requireSession(destinationWithQuery("/add-book", await searchParams));
  return <AddBook user={{ name: user.name, email: user.email }} />;
}
