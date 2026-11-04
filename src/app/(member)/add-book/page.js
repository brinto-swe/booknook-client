import ProtectedPlaceholder from "@/components/auth/ProtectedPlaceholder";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";

export const metadata = { title: "Add Book" };
export default async function AddBookPage({ searchParams }) {
  return <ProtectedPlaceholder destination={destinationWithQuery("/add-book", await searchParams)} title="Share your next great read" description="Your book-sharing space is ready. You’ll be able to add a book to the library here soon." />;
}
