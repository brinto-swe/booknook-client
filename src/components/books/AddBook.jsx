"use client";
import { useRouter } from "next/navigation";
import { BookPlus } from "lucide-react";
import BookForm from "./BookForm";
export default function AddBook({ user }) {
  const router = useRouter();
  return <section className="book-page book-add"><header className="book-heading"><BookPlus aria-hidden="true" /><h1>Add a Book</h1><p>Share a story. Help someone discover their next great read.</p></header><div className="book-surface"><BookForm user={user} onSuccess={book => router.push(`/books/${book._id}`)} /></div></section>;
}
