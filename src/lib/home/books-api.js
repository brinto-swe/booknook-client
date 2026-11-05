import { catalogUrl, fetchBooksPage, HOME_BOOK_LIMIT } from "../books/public-api.js";
export function getBooksUrl() { return catalogUrl({ page: 1, limit: HOME_BOOK_LIMIT }); }
export async function fetchLatestBooks(signal) {
  return (await fetchBooksPage({ page: 1, limit: HOME_BOOK_LIMIT }, signal)).books;
}
