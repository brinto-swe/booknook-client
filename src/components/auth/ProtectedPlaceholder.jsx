import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireSession } from "@/lib/session";

export default async function ProtectedPlaceholder({ destination, title, description }) {
  await requireSession(destination);
  return <section className="member-page"><div className="member-card">
    <BookOpen className="member-icon" aria-hidden="true" />
    <h1>{title}</h1><p>{description}</p>
    <Link href="/" className="button button-pill">Back to the library</Link>
  </div></section>;
}
