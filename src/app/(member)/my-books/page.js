import ProtectedPlaceholder from "@/components/auth/ProtectedPlaceholder";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";

export const metadata = { title: "My Books" };
export default async function MyBooksPage({ searchParams }) {
  return <ProtectedPlaceholder destination={destinationWithQuery("/my-books", await searchParams)} title="My Books" description="A home for the books you share. Your personal book collection will appear here soon." />;
}
