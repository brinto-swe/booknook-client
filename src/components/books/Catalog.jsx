"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BookCard from "@/components/home/BookCard";
import { catalogCategories, fetchBooksPage } from "@/lib/books/public-api";
import "./catalog.css";
export default function Catalog() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("category");
  const category = catalogCategories.includes(requested) ? requested : "";
  return <CatalogContent key={category} initialCategory={category} />;
}
function CatalogContent({ initialCategory }) {
  const [query, setQuery] = useState({ page: 1, category: initialCategory });
  const [state, setState] = useState({ status: "loading", books: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    fetchBooksPage(query, signal).then(data => {
      if (!controller.signal.aborted) setState({ status: "ready", ...data });
    }).catch(() => { if (!controller.signal.aborted) setState({ status: "error", books: [] }); });
    return () => controller.abort();
  }, [query, attempt]);
  const change = next => { setState({ status: "loading", books: [] }); setQuery(next); };
  return <section className="catalog-page" aria-labelledby="catalog-title">
    <div className="section-heading-row"><div><h1 id="catalog-title" className="section-title"><BookOpen aria-hidden="true" />All Books</h1><p className="section-subtitle">Find your next great read in our collection</p></div><label className="catalog-filter">Category<select value={query.category} onChange={event => change({ page: 1, category: event.target.value })}><option value="">All categories</option>{catalogCategories.map(category => <option key={category}>{category}</option>)}</select></label></div>
    {state.status === "error" ? <div className="catalog-notice" role="alert"><p>We couldn’t load the library right now.</p><button className="button button-outline" onClick={() => { setState({ status: "loading", books: [] }); setAttempt(value => value + 1); }}>Retry</button></div>
    : state.status === "ready" && state.pagination.total === 0 ? <div className="catalog-empty" role="status"><BookOpen aria-hidden="true" /><h2>No books found</h2><p>{query.category ? "There are no books in this category yet. Try another category." : "Our shelves are waiting for their first books."}</p></div>
    : <><div className="books-grid catalog-grid" aria-busy={state.status === "loading"} aria-label="Book collection">{state.status === "loading" ? Array.from({ length: 12 }, (_, index) => <div className="book-card book-skeleton" key={index}><Skeleton className="skeleton-cover" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>) : state.books.map(book => <BookCard key={book._id} book={book} />)}</div>
    {state.status === "loading" && <p className="sr-only" role="status">Loading books.</p>}
    {state.status === "ready" && <nav className="catalog-pagination" aria-label="Catalog pages"><button className="button button-outline" disabled={query.page === 1} onClick={() => change({ ...query, page: query.page - 1 })}>Previous</button><span role="status">Page {query.page} of {Math.max(1, state.pagination.totalPages)} · {state.pagination.total} books</span><button className="button button-outline" disabled={query.page >= state.pagination.totalPages} onClick={() => change({ ...query, page: query.page + 1 })}>Next</button></nav>}</>}
  </section>;
}
