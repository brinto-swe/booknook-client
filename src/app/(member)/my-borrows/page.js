import { requireSession } from "@/lib/session";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";
import MyBorrows from "@/components/borrows/MyBorrows";
export const metadata = { title: "My Borrows" };
export default async function MyBorrowsPage({ searchParams }) {
  await requireSession(destinationWithQuery("/my-borrows", await searchParams));
  return <MyBorrows />;
}
