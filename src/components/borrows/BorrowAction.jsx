"use client";
import { useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { borrowsApi } from "@/lib/borrows/api";
import { borrowError, formatBorrowDate, createSubmissionGuard } from "@/lib/borrows/core";
import { useBookError } from "@/components/books/useBookResource";
import BorrowDialog from "./BorrowDialog";
export default function BorrowAction({ book, user, onBorrowed }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), [blocked, setBlocked] = useState(false);
  const guard = useRef(createSubmissionGuard());
  const handleAuthError = useBookError();
  const unavailable = !Number.isSafeInteger(book.availableCopies) || book.availableCopies <= 0;
  const close = () => { setOpen(false); if (blocked) onBorrowed(); };
  const confirm = () => guard.current(async () => {
    if (unavailable || blocked) return;
    setBusy(true); setError(null);
    try {
      const loan = await borrowsApi.borrow(book._id);
      setOpen(false); toast.success(`Book borrowed. Due ${formatBorrowDate(loan.returnDate)} (UTC).`); onBorrowed();
    } catch (error) {
      handleAuthError(error);
      const message = borrowError(error); setError(message); toast.error(message);
      if (["DUPLICATE_BORROW", "BOOK_UNAVAILABLE"].includes(error.code)) setBlocked(true);
    } finally { setBusy(false); }
  });
  return <><button className="book-primary book-borrow" disabled={unavailable} onClick={() => { setError(null); setOpen(true); }}><BookOpen aria-hidden="true" />Borrow This Book</button>
    <BorrowDialog open={open} onClose={close} title={`Borrow “${book.title}”`} description="You can keep this book for 7 days." busy={busy} error={error} disabled={unavailable || blocked} onConfirm={confirm} confirmLabel="Confirm Borrow">
      <p className="borrow-muted">by {book.author}</p><label>User Name<input value={user?.name || ""} readOnly /></label><label>User Email<input value={user?.email || ""} readOnly type="email" /></label>
    </BorrowDialog></>;
}
