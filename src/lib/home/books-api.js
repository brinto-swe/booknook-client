import { getApiUrl } from "../api/url.js";

export function getBooksUrl() {
  const url = new URL(getApiUrl("/books"));
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "6");
  return url.toString();
}

export async function fetchLatestBooks(signal) {
  const response = await fetch(getBooksUrl(), {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const error = new Error("The library is temporarily unavailable.");
    error.status = response.status;
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid catalog JSON response.");
  }
  if (result?.success !== true || !Array.isArray(result.data?.books)) {
    throw new Error("Invalid catalog response.");
  }

  return result.data.books.slice(0, 6).map(book => {
    if (!book || typeof book._id !== "string" || !/^[a-f\d]{24}$/i.test(book._id)
      || typeof book.title !== "string" || !book.title.trim()) {
      throw new Error("Invalid catalog response.");
    }
    // Only ID/title are needed to identify a card. Missing display metadata
    // should use card fallbacks rather than turning a successful read into an error.
    const text = (value, fallback) => typeof value === "string" && value.trim() ? value.trim() : fallback;
    return {
      _id: book._id,
      title: book.title.trim(),
      author: text(book.author, "Unknown author"),
      category: text(book.category, "Others"),
      imageUrl: text(book.imageUrl, ""),
    };
  });
}
