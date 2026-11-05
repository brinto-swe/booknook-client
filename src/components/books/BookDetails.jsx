"use client";
import Link from "next/link";
import { ArrowLeft, BookOpen, UserRound } from "lucide-react";
import BorrowAction from "../borrows/BorrowAction";
import { useBookResource } from "./useBookResource";
import BookCover from "./BookCover";
import { BookError, BookLoading } from "./BookStates";
export default function BookDetails({ id, user }) {
  const { data: book, loading, error, refresh } = useBookResource("detail", id);
  if (loading) return <section className="book-page"><BookLoading /></section>;
  if (error) return <section className="book-page"><BookError error={error} retry={refresh} /></section>;
  const unavailable = !Number.isSafeInteger(book.availableCopies) || book.availableCopies <= 0;
  return <article className="book-page bm-details"><BookCover src={book.image ?? book.imageUrl} title={book.title} /><div className="book-detail-copy"><span className="book-category">{book.category}</span><h1>{book.title}</h1><p className="bm-author">by {book.author}</p><p className="book-description">{book.description}</p><div className="book-added-by"><UserRound aria-hidden="true" /><div><span>Added by</span><strong>{book.addedByName || "Library member"}</strong>{book.addedByEmail && <span>{book.addedByEmail}</span>}</div></div><p className={`book-availability ${unavailable ? "unavailable" : ""}`}><BookOpen aria-hidden="true" />{unavailable ? "Currently unavailable" : `${book.availableCopies} ${book.availableCopies === 1 ? "copy" : "copies"} left`}<span> / {book.totalCopies} total copies</span></p><BorrowAction book={book} user={user} onBorrowed={refresh} /><Link className="book-back" href="/books"><ArrowLeft aria-hidden="true" />Back to all books</Link></div></article>;
}
