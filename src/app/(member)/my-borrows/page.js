import { requireSession } from "@/lib/session";
import { destinationWithQuery } from "@/lib/auth-ui/redirects";
import MyBorrows from "@/components/borrows/MyBorrows";
// Fresh server session verification may block this page's navigation.
export const instant = false;
export const metadata = { title: "My Borrows" };
export default async function MyBorrowsPage({ searchParams }) {
  await requireSession(destinationWithQuery("/my-borrows", await searchParams));
  return <MyBorrows />;
}
