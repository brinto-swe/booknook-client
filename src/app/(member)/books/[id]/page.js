import ProtectedPlaceholder from "@/components/auth/ProtectedPlaceholder";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";

export const metadata = { title: "Book Details" };
export default async function BookDetailsPage({ params, searchParams }) {
  const { id } = await params;
  return <ProtectedPlaceholder destination={destinationWithQuery(`/books/${encodeURIComponent(id)}`, await searchParams)} title="Your next chapter" description="You’re signed in and ready to explore. Full book details will be available here soon." />;
}
