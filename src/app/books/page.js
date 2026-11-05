import { Suspense } from "react";
import PageShell from "@/components/auth/PageShell";
import Catalog from "@/components/books/Catalog";
export const metadata = { title: "All Books" };
export default function BooksPage() { return <PageShell><Suspense fallback={<p role="status">Loading books…</p>}><Catalog /></Suspense></PageShell>; }
