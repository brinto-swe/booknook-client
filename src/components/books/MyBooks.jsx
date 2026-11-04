"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { booksApi } from "@/lib/books/api";
import BookForm from "./BookForm";
import BookCover from "./BookCover";
import { useBookResource, useBookError } from "./useBookResource";
import { BookError, BookLoading } from "./BookStates";
export default function MyBooks() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleting = useRef(false);
  const { data, loading, error, refresh } = useBookResource("mine", page);
  const handleError = useBookError();
  function changePage(next) { setPage(next); refresh(); }
  function close() { if (!busy) { setSelected(null); setDeleteError(""); } }
  function updated() { setSelected(null); refresh(); }
  async function remove() {
    if (deleting.current) return;
    deleting.current = true; setBusy(true); setDeleteError("");
    try {
      await booksApi.remove(selected.book._id);
      toast.success("Book deleted."); setSelected(null);
      if (data.books.length === 1 && page > 1) setPage(page - 1);
      refresh();
    } catch (failure) { const message = handleError(failure); setDeleteError(message); toast.error(message); }
    finally { deleting.current = false; setBusy(false); }
  }
  return <section className="book-page book-library"><header className="book-heading"><h1>My Books</h1><p>The stories you’ve shared, all in one place.</p></header><div className="book-toolbar"><p>{data ? `${data.pagination.total} books in your collection` : "Your shared collection"}</p><Link className="book-primary" href="/add-book"><Plus aria-hidden="true" />Add a Book</Link></div>
    {loading ? <BookLoading table /> : error ? <BookError error={error} retry={refresh} /> : data.books.length === 0 ? <div className="book-state book-surface"><BookOpen aria-hidden="true" /><h2>No books here yet</h2><p>Add your first book and share a new chapter with the community.</p><Link className="book-primary" href="/add-book">Add a Book</Link>{page > 1 && <button onClick={() => changePage(page - 1)}>Previous page</button>}</div> : <>
      <div className="book-table-wrap book-surface"><table className="book-table"><caption className="sr-only">Books shared by your account</caption><thead><tr><th scope="col">Book</th><th scope="col">Category</th><th scope="col">Copies</th><th scope="col">Actions</th></tr></thead><tbody>{data.books.map(book => <tr key={book._id}><td data-label="Book"><Link className="book-table-title" href={`/books/${book._id}`}><BookCover src={book.image ?? book.imageUrl} title={book.title} /><span><strong>{book.title}</strong><small>{book.author}</small></span></Link></td><td data-label="Category"><span className="book-category">{book.category}</span></td><td data-label="Copies"><strong>{book.availableCopies}</strong> / {book.totalCopies}<small className="book-copy-hint">available</small></td><td data-label="Actions"><div className="book-actions"><button aria-label={`Edit ${book.title}`} onClick={() => setSelected({ type:"edit", book })}><Pencil aria-hidden="true" /><span>Edit</span></button><button className="book-delete" aria-label={`Delete ${book.title}`} onClick={() => { setDeleteError(""); setSelected({ type:"delete", book }); }}><Trash2 aria-hidden="true" /><span>Delete</span></button></div></td></tr>)}</tbody></table></div>
      <nav className="book-pagination" aria-label="Collection pagination"><button disabled={page <= 1} onClick={() => changePage(page - 1)}><ChevronLeft aria-hidden="true" />Previous</button><span>Page {page} of {data.pagination.totalPages}</span><button disabled={page >= data.pagination.totalPages} onClick={() => changePage(page + 1)}>Next<ChevronRight aria-hidden="true" /></button></nav>
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) close(); }}><DialogContent className={`book-dialog ${selected?.type === "edit" ? "book-edit-dialog" : ""}`} showCloseButton={!busy}><DialogTitle>{selected?.type === "edit" ? "Edit Book" : "Delete this book?"}</DialogTitle><DialogDescription>{selected?.type === "edit" ? "Update the details below. Outstanding copies will be preserved." : `“${selected?.book.title ?? "This book"}” will be removed from your collection. This cannot be undone.`}</DialogDescription>
      {selected?.type === "edit" && <BookForm key={selected.book._id} book={selected.book} onSuccess={updated} onBusy={setBusy} />}
      {selected?.type === "delete" && <>{deleteError && <p className="book-error" role="alert">{deleteError}</p>}<div className="book-dialog-actions"><button onClick={close} disabled={busy}>Cancel</button><button className="book-danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete Book"}</button></div></>}
    </DialogContent></Dialog>
  </section>;
}
