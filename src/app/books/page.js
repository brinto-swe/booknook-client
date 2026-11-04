import Link from "next/link";
import { BookOpen } from "lucide-react";
import PageShell from "@/components/auth/PageShell";

export const metadata = { title: "All Books" };
export default function BooksPage() {
  return <PageShell><section className="member-page"><div className="member-card">
    <BookOpen className="member-icon" aria-hidden="true" /><h1>All Books</h1>
    <p>Our library is growing. Discover the latest additions on our homepage while we prepare the full catalog.</p>
    <Link href="/#arrivals-title" className="button button-pill">Explore new arrivals</Link>
  </div></section></PageShell>;
}
