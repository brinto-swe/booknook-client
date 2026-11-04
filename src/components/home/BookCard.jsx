"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const badgeClass = { "Self-Help": "badge-self-help", Science: "badge-science", Fiction: "badge-fiction", History: "badge-history", Kids: "badge-kids", Others: "badge-others" };

export default function BookCard({ book, preview = false }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = typeof book.imageUrl === "string" ? book.imageUrl : "";
  const safeImage = imageUrl.startsWith("/assets/") || /^https?:\/\//i.test(imageUrl);
  return <Card className="book-card"><div className="book-cover">{failed || !safeImage ? <div className="cover-fallback"><BookOpen size={42} /><span>{book.title}</span></div> : <Image src={imageUrl} alt={`${book.title} book cover`} fill sizes="(max-width: 600px) 40vw, (max-width: 1000px) 26vw, 14vw" unoptimized onError={() => setFailed(true)} />}</div><h3>{book.title}</h3><p className="book-author">{book.author}</p><Badge className={`book-badge ${badgeClass[book.category] || "badge-others"}`}>{book.category}</Badge>{preview ? <button className="button book-details" onClick={() => toast.info("This is a preview book. Live book details will be available when the library catalog is populated.")}>View Details</button> : <Link href={`/books/${book._id}`} className="button book-details">View Details</Link>}</Card>;
}
