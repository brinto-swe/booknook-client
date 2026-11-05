import { getApiUrl } from "../api/url.js";
export const catalogCategories = ["Fiction", "Science", "History", "Kids", "Others"];
export const CATALOG_PAGE_SIZE = 12;
export const HOME_BOOK_LIMIT = 30;
export function catalogUrl({ page = 1, limit = CATALOG_PAGE_SIZE, category = "" } = {}) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (page - 1) * limit > 1000000 || (category && !catalogCategories.includes(category))) throw new Error("Invalid catalog query.");
  const url = new URL(getApiUrl("/books"));
  url.searchParams.set("page", String(page)); url.searchParams.set("limit", String(limit));
  if (category) url.searchParams.set("category", category);
  return url.toString();
}
function mapBook(book) {
  if (!book || typeof book._id !== "string" || !/^[a-f\d]{24}$/i.test(book._id) || typeof book.title !== "string" || !book.title.trim()) throw new Error("Invalid catalog response.");
  const text = (value, fallback) => typeof value === "string" && value.trim() ? value.trim() : fallback;
  return { _id: book._id, title: book.title.trim(), author: text(book.author, "Unknown author"), category: text(book.category, "Others"), imageUrl: text(book.imageUrl, text(book.image, "")) };
}
export async function fetchBooksPage(options = {}, signal) {
  const response = await fetch(catalogUrl(options), { signal, cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) { const error = new Error("The library is temporarily unavailable."); error.status = response.status; throw error; }
  let result;
  try { result = await response.json(); } catch { throw new Error("Invalid catalog JSON response."); }
  const pagination = result?.data?.pagination;
  if (result?.success !== true || !Array.isArray(result.data?.books) || !pagination || ![pagination.page, pagination.limit, pagination.total, pagination.totalPages].every(Number.isSafeInteger) || pagination.page < 1 || pagination.limit < 1 || pagination.limit > 100 || pagination.total < 0 || pagination.totalPages !== Math.ceil(pagination.total / pagination.limit)) throw new Error("Invalid catalog response.");
  return { books: result.data.books.slice(0, options.limit || CATALOG_PAGE_SIZE).map(mapBook), pagination };
}
