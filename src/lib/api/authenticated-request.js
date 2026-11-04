import { getApiUrl } from "./url.js";
const messages = {
  400: "Check the book fields and try again.", 401: "Please sign in again to continue.",
  403: "You don’t have permission to change this book.", 404: "This book could not be found.",
  409: "The book has outstanding loans or changed recently. Refresh and try again.",
  429: "Too many requests. Please try again shortly.",
};
export class BookApiError extends Error {
  constructor(status = 0) { super(messages[status] || "The library is unavailable. Please try again."); this.name = "BookApiError"; this.status = status; }
}
// A fresh JWT is requested for each operation. No token storage or mutation retries.
export function createAuthenticatedRequest(getToken, fetcher = (...args) => fetch(...args)) {
  return async function request(path, { method = "GET", body, signal } = {}) {
    const timeout = AbortSignal.timeout(15000);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const result = await getToken(combined);
      combined.throwIfAborted();
      if (result?.error) throw new BookApiError(result.error.status === 401 ? 401 : 503);
      if (typeof result?.data?.token !== "string" || !result.data.token) throw new BookApiError(401);
      const response = await fetcher(getApiUrl(path), { method, signal: combined, cache: "no-store",
        headers: { Accept: "application/json", Authorization: `Bearer ${result.data.token}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new BookApiError(response.status);
      let json;
      try { json = await response.json(); } catch { throw new BookApiError(502); }
      if (json?.success !== true || !json.data || typeof json.data !== "object") throw new BookApiError(502);
      return json.data;
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      if (error instanceof BookApiError) throw error;
      throw new BookApiError(timeout.aborted ? 504 : 0);
    }
  };
}
export function createBooksApi(request) {
  const idPath = id => {
    if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) throw new BookApiError(404);
    return `/books/${id}`;
  };
  return {
    mine: (page = 1, signal) => request(`/books?mine=true&page=${page}&limit=10`, { signal }),
    detail: (id, signal) => request(idPath(id), { signal }),
    create: body => request("/books", { method: "POST", body }),
    update: (id, body) => request(idPath(id), { method: "PATCH", body }),
    remove: id => request(idPath(id), { method: "DELETE" }),
  };
}
