import ProtectedPlaceholder from "@/components/auth/ProtectedPlaceholder";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";

export const metadata = { title: "My Borrows" };
export default async function MyBorrowsPage({ searchParams }) {
  return <ProtectedPlaceholder destination={destinationWithQuery("/my-borrows", await searchParams)} title="My Borrows" description="Keep track of your reading journey. Your borrowed books will appear here soon." />;
}
