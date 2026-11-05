"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchLatestBooks } from "@/lib/home/books-api";
import BookCard from "./BookCard";

export default function NewArrivals() {
  const [state, setState] = useState({ status: "loading", books: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetchLatestBooks(controller.signal).then(books => {
      if (active) setState({ status: books.length ? "ready" : "empty", books });
    }).catch(() => {
      if (active) setState({ status: "error", books: [] });
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  const notice = state.status === "empty" || state.status === "error";
  const books = state.books;
  return (
    <section className="new-arrivals home-section" aria-labelledby="arrivals-title">
      <div className="section-heading-row"><div><h2 id="arrivals-title" className="section-title"><BookOpen aria-hidden="true" />New Arrivals</h2><p className="section-subtitle">Check out the latest additions to our library</p></div><Link href="/books" className="button button-outline button-pill see-all">See All Books <ArrowRight size={17} aria-hidden="true" /></Link></div>
      {notice && <div className="catalog-notice" role="status"><span>{state.status === "empty" ? "Our shelves are waiting for their first books." : "We couldn’t load the library right now."}</span>{state.status === "error" && <Button variant="ghost" size="sm" onClick={() => { setState({ status: "loading", books: [] }); setAttempt(value => value + 1); }}><RefreshCw size={14} /> Retry</Button>}</div>}
      <div className="books-grid" aria-busy={state.status === "loading"} aria-label="Latest books">{state.status === "loading" ? Array.from({ length: 10 }, (_, index) => <div className="book-card book-skeleton" key={index}><Skeleton className="skeleton-cover" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /><Skeleton className="mt-auto h-8 w-full" /></div>) : books.map(book => <BookCard key={book._id} book={book} />)}</div>
      {state.status === "loading" && <p role="status" className="sr-only">Loading the latest books.</p>}
    </section>
  );
}
