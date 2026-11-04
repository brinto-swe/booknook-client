"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { isImageUrl } from "@/lib/books/schema";
export default function BookCover({ src, title, className = "" }) {
  const [failed, setFailed] = useState(null);
  return <div className={`bm-cover ${className}`}>
    {isImageUrl(src) && failed !== src ?
      /* External cover URLs are user content; no image optimizer allowlist or hosting API. */
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`${title || "Book"} cover`} referrerPolicy="no-referrer" onError={() => setFailed(src)} />
      : <span className="cover-fallback"><BookOpen aria-hidden="true" /><span>Cover unavailable</span></span>}
  </div>;
}
