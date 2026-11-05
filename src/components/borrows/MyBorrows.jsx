"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { borrowsApi } from "@/lib/borrows/api";
import { borrowError, formatBorrowDate, createSubmissionGuard } from "@/lib/borrows/core";
import { loginRedirectURL } from "@/lib/auth-ui/redirects";
import BookCover from "@/components/books/BookCover";
import BorrowDialog from "./BorrowDialog";
import "./borrows.css";
export default function MyBorrows() {
  const router = useRouter();
  const [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true }), [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const guard = useRef(createSubmissionGuard());
  const refresh = () => { setState({ loading: true }); setRevision(value => value + 1); };
  useEffect(() => {
    const controller = new AbortController();
    borrowsApi.list(page, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false });
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) router.replace(loginRedirectURL("/my-borrows"));
      setState({ loading: false, error: borrowError(error) });
    });
    return () => controller.abort();
  }, [page, revision, router]);
  const returnBook = () => guard.current(async () => {
    if (!selected || selected.status !== "borrowed") return;
    setBusy(true); setError(null);
    try {
      await borrowsApi.returnBook(selected._id);
      setSelected(null); toast.success("Book returned. Thank you!"); refresh(); router.refresh();
    } catch (error) {
      if (error.status === 401) router.replace(loginRedirectURL("/my-borrows"));
      const message = borrowError(error); toast.error(message);
      if (error.code === "BORROW_ALREADY_RETURNED") { setSelected(null); refresh(); router.refresh(); }
      else setError(message);
    } finally { setBusy(false); }
  });
  const changePage = value => { setState({ loading: true }); setPage(value); };
  return <section className="borrow-page"><header><h1>My Borrows</h1><p>Your reading journey, from current loans to returned favorites.</p></header>
    {state.loading ? <div role="status" aria-label="Loading borrow history" className="borrow-list">{[1,2,3].map(key => <div key={key} className="borrow-skeleton" />)}<span className="sr-only">Loading borrow history…</span></div>
    : state.error ? <div className="borrow-state" role="alert"><p>{state.error}</p><button className="borrow-primary" onClick={refresh}>Retry</button></div>
    : state.data.borrows.length === 0 ? <div className="borrow-state"><h2>No borrowed books yet</h2><p>Find your next great read in our collection.</p><Link className="borrow-primary" href="/books">Browse Books</Link></div>
    : <><p className="borrow-muted">{state.data.pagination.total} {state.data.pagination.total === 1 ? "record" : "records"} · Dates shown in UTC</p><div className="borrow-list">{state.data.borrows.map(loan => <article className="borrow-record" key={loan._id}>
      <BookCover src={loan.bookImage} title={loan.bookTitle} /><div className="borrow-record-copy"><h2><Link href={`/books/${loan.bookId}`}>{loan.bookTitle}</Link></h2><span className={`borrow-status ${loan.status === "returned" ? "returned" : "active"}`}>{loan.status === "returned" ? "Returned" : "Active loan"}</span>
      <dl><div><dt>Borrowed</dt><dd>{formatBorrowDate(loan.borrowDate)}</dd></div><div><dt>Due date</dt><dd>{formatBorrowDate(loan.returnDate)}</dd></div><div><dt>Actually returned</dt><dd>{loan.returnedAt ? formatBorrowDate(loan.returnedAt) : "Not returned yet"}</dd></div></dl>
      {loan.status === "borrowed" && <button className="borrow-primary" onClick={() => { setError(null); setSelected(loan); }}>Return Book</button>}</div></article>)}</div>
      {state.data.pagination.totalPages > 1 && <nav className="borrow-pagination" aria-label="Borrow history pages"><button className="borrow-secondary" disabled={page === 1} onClick={() => changePage(page - 1)}>Previous</button><span>Page {page} of {state.data.pagination.totalPages}</span><button className="borrow-secondary" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Next</button></nav>}</>}
    <BorrowDialog open={Boolean(selected)} onClose={() => setSelected(null)} title={`Return “${selected?.bookTitle || "book"}”?`} description="Confirm that you are returning this book. It will stay in your borrow history." busy={busy} error={error} onConfirm={returnBook} confirmLabel="Confirm Return" />
  </section>;
}
