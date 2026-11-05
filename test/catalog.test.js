import test from "node:test";
import assert from "node:assert/strict";
import { catalogUrl, fetchBooksPage, HOME_BOOK_LIMIT, CATALOG_PAGE_SIZE } from "../src/lib/books/public-api.js";
const book = index => ({ _id: String(index).padStart(24, "0"), title: `Book ${index}`, image: "https://example.test/cover.jpg" });
test("catalog uses independently sized pages and reaches all records", async t => {
  const requested = [];
  t.mock.method(globalThis, "fetch", async url => {
    const query = new URL(url).searchParams; const page = Number(query.get("page")), limit = Number(query.get("limit")); requested.push(page);
    return Response.json({ success: true, data: { books: Array.from({ length: page === 3 ? 1 : 12 }, (_, i) => book((page - 1) * limit + i + 1)), pagination: { page, limit, total: 25, totalPages: 3 } } });
  });
  const result = [];
  for (let page = 1; page <= 3; page++) result.push(...(await fetchBooksPage({ page })).books);
  assert.equal(result.length, 25); assert.equal(new Set(result.map(book => book._id)).size, 25); assert.deepEqual(requested, [1, 2, 3]);
  assert.equal(CATALOG_PAGE_SIZE, 12); assert.equal(HOME_BOOK_LIMIT, 30);
});
test("category filters are preserved across catalog pages and use supported query names", () => {
  for (const page of [1, 2]) {
    const query = new URL(catalogUrl({ page, category: "Science" })).searchParams;
    assert.equal(query.get("category"), "Science"); assert.equal(query.get("page"), String(page)); assert.equal(query.get("limit"), "12");
    assert.equal(query.has("mine"), false);
  }
  assert.equal(new URL(catalogUrl()).searchParams.has("category"), false);
  for (const query of [{ limit: 101 }, { page: 0 }, { page: "1" }, { category: "Self-Help" }]) assert.throws(() => catalogUrl(query));
});
test("genuinely empty catalog preserves zero total and does not fabricate cards", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true, data: { books: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } } }));
  assert.deepEqual(await fetchBooksPage(), { books: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
});
test("malformed pagination is an error, never a successful empty collection", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true, data: { books: [], pagination: { page: 1, limit: 12, total: 25, totalPages: 0 } } }));
  await assert.rejects(fetchBooksPage(), /Invalid catalog/);
});
test("current backend image field maps to the existing card", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true, data: { books: [book(1)], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } } }));
  assert.equal((await fetchBooksPage()).books[0].imageUrl, book(1).image);
});
