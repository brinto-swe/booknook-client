import assert from "node:assert/strict";
import test from "node:test";
import { fetchLatestBooks, getBooksUrl } from "../src/lib/home/books-api.js";

const record = (index = 1) => ({
  _id: String(index).padStart(24, "0"),
  title: `Book ${index}`,
  author: "Author",
  category: "Fiction",
  imageUrl: "https://example.com/cover.jpg",
});
const response = books => Response.json({ success: true, data: { books, pagination: { page: 1, limit: 30, total: books.length, totalPages: Math.ceil(books.length / 30) } } });

test("homepage Books API contract", async (t) => {
  const previousOrigin = process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_API_URL;
  t.after(() => {
    if (previousOrigin === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previousOrigin;
  });

  await t.test("uses the Express endpoint and existing first-page/latest-30 parameters", () => {
    assert.equal(getBooksUrl(), "http://localhost:5000/books?page=1&limit=30");
    process.env.NEXT_PUBLIC_API_URL = "https://catalog.example.com/";
    assert.equal(getBooksUrl(), "https://catalog.example.com/books?page=1&limit=30");
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  await t.test("maps the backend envelope and caps display at 30 records", async () => {
    const controller = new AbortController();
    const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.equal(url, "http://localhost:5000/books?page=1&limit=30");
      assert.equal(options.signal, controller.signal);
      assert.equal(options.cache, "no-store");
      assert.equal(options.headers.Accept, "application/json");
      return response(Array.from({ length: 32 }, (_, i) => record(i + 1)));
    });
    const books = await fetchLatestBooks(controller.signal);
    assert.equal(books.length, 30);
    assert.deepEqual(books[0], record());
    mock.mock.restore();
  });

  await t.test("missing optional fields use safe card fallbacks", async () => {
    const mock = t.mock.method(globalThis, "fetch", async () => response([
      { _id: record()._id, title: "  A title  " },
      { ...record(2), author: null, category: " ", imageUrl: 123 },
    ]));
    const books = await fetchLatestBooks();
    assert.deepEqual(books[0], { _id: record()._id, title: "A title", author: "Unknown author", category: "Others", imageUrl: "" });
    assert.equal(books[1].imageUrl, "");
    mock.mock.restore();
  });

  await t.test("empty successful catalog stays empty for the distinct empty state", async () => {
    const mock = t.mock.method(globalThis, "fetch", async () => response([]));
    assert.deepEqual(await fetchLatestBooks(), []);
    mock.mock.restore();
  });

  await t.test("HTTP failure preserves status without exposing the response body", async () => {
    const mock = t.mock.method(globalThis, "fetch", async () => new Response("PRIVATE server details", { status: 503 }));
    await assert.rejects(fetchLatestBooks(), error => error.status === 503 && !error.message.includes("PRIVATE"));
    mock.mock.restore();
  });

  await t.test("malformed JSON and invalid envelopes fail safely", async () => {
    for (const body of ["<html>PRIVATE error</html>", "null", '{"success":true,"data":{"books":{}}}']) {
      const mock = t.mock.method(globalThis, "fetch", async () => new Response(body));
      await assert.rejects(fetchLatestBooks(), error => /Invalid catalog/.test(error.message) && !error.message.includes("PRIVATE"));
      mock.mock.restore();
    }
  });

  await t.test("missing required ID or title is not treated as an empty catalog", async () => {
    for (const invalid of [{ ...record(), _id: "bad" }, { ...record(), title: " " }]) {
      const mock = t.mock.method(globalThis, "fetch", async () => response([invalid]));
      await assert.rejects(fetchLatestBooks(), /Invalid catalog response/);
      mock.mock.restore();
    }
  });

  await t.test("network failures reject and a subsequent request actually retries", async () => {
    let calls = 0;
    const mock = t.mock.method(globalThis, "fetch", async () => {
      if (++calls === 1) throw new TypeError("Failed to fetch");
      return response([record()]);
    });
    await assert.rejects(fetchLatestBooks(), /Failed to fetch/);
    assert.equal((await fetchLatestBooks()).length, 1);
    assert.equal(calls, 2);
    mock.mock.restore();
  });

  await t.test("cancellation/timeout signals abort the underlying request", async () => {
    const controller = new AbortController();
    const mock = t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));
    const pending = fetchLatestBooks(controller.signal);
    controller.abort(new DOMException("Timed out", "TimeoutError"));
    await assert.rejects(pending, { name: "TimeoutError" });
    mock.mock.restore();
  });

  await t.test("invalid API configuration errors never echo configured values", () => {
    for (const value of ["PRIVATE invalid origin", "https://PRIVATE:PRIVATE@example.com", "ftp://example.com"]) {
      process.env.NEXT_PUBLIC_API_URL = value;
      assert.throws(getBooksUrl, error => error.message === "Invalid public API URL.");
    }
    delete process.env.NEXT_PUBLIC_API_URL;
  });
});
