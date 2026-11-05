import { BookApiError } from "../api/authenticated-request.js";
function validId(id) {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) throw new BookApiError(400);
  return id;
}
export function createBorrowsApi(request) {
  return {
    list: async (page = 1, signal) => {
      if (!Number.isSafeInteger(page) || page < 1) throw new BookApiError(400);
      const data = await request(`/borrows?page=${page}&limit=10`, { signal });
      if (!Array.isArray(data.borrows) || !Number.isSafeInteger(data.pagination?.totalPages)) throw new BookApiError(502);
      return data;
    },
    borrow: bookId => request("/borrows", { method: "POST", body: { bookId: validId(bookId) } }),
    returnBook: id => request(`/borrows/${validId(id)}`, { method: "DELETE" }),
  };
}
export function borrowError(error) {
  const codes = {
    DUPLICATE_BORROW: "You already have an active loan of this book. Check My Borrows.",
    BOOK_UNAVAILABLE: "No copies are available now. Please try again later.",
    BORROW_ALREADY_RETURNED: "This book has already been returned. Your history will refresh.",
    INVENTORY_CONFLICT: "Availability changed. Refresh and try again.",
    BORROW_NOT_FOUND: "This loan could not be found.",
    BOOK_NOT_FOUND: "This book could not be found.",
  };
  return codes[error?.code] || ({ 401: "Please sign in again to continue.", 403: "You cannot access this loan.", 429: "Too many requests. Please try again shortly." })[error?.status] || "We couldn't complete your request. Please try again.";
}
export function formatBorrowDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}
// Locks synchronously, including two clicks before React renders its busy state.
export function createSubmissionGuard() {
  let pending = false;
  return async operation => {
    if (pending) return;
    pending = true;
    try { return await operation(); } finally { pending = false; }
  };
}
