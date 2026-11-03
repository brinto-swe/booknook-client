export function getBooksUrl() {
  const origin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const url = new URL("/books", origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid public API URL.");
  url.searchParams.set("limit", "6");
  return url.toString();
}

export async function fetchLatestBooks(signal) {
  const response = await fetch(getBooksUrl(), { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("The library is temporarily unavailable.");
  const result = await response.json();
  if (result.success !== true || !Array.isArray(result.data?.books)) throw new Error("Invalid catalog response.");
  const books = result.data.books.slice(0, 6);
  if (books.some(book => !book || typeof book._id !== "string" || !/^[a-f\d]{24}$/i.test(book._id)
    || typeof book.title !== "string" || typeof book.author !== "string" || typeof book.category !== "string"
    || typeof book.imageUrl !== "string")) throw new Error("Invalid catalog response.");
  return books;
}
