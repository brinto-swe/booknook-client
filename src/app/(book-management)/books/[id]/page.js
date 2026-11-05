import { requireSession } from "@/lib/session";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";
import BookDetails from "@/components/books/BookDetails";
export const metadata = { title: "Book Details" };
export default async function BookDetailsPage({ params, searchParams }) {
  const { id } = await params;
  const { user } = await requireSession(destinationWithQuery(`/books/${encodeURIComponent(id)}`, await searchParams));
  return <BookDetails id={id} user={{ name: user.name, email: user.email }} />;
}
