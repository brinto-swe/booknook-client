import Link from "next/link";
import { BookOpen } from "lucide-react";
export function BookLoading({ table = false }) {
  return <div role="status" aria-label="Loading books" className={`book-surface book-skeleton ${table ? "table-skeleton" : ""}`}><span>Loading books…</span>{[0,1,2].map(i => <div key={i} className="book-skeleton-line" />)}</div>;
}
export function BookError({ error, retry }) {
  return <div className="book-state book-surface" role="alert"><BookOpen aria-hidden="true" /><h2>{error.status === 404 ? "Book not found" : "Unable to load books"}</h2><p>{error.message}</p>{error.status !== 404 && <button className="book-primary" onClick={retry}>Try again</button>}<Link href="/books">Back to all books</Link></div>;
}
