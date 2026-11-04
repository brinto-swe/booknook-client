import { requireSession } from "@/lib/session";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";
import MyBooks from "@/components/books/MyBooks";
export const metadata = { title: "My Books" };
export default async function MyBooksPage({ searchParams }) {
  await requireSession(destinationWithQuery("/my-books", await searchParams));
  return <MyBooks />;
}
