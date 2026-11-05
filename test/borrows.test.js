import test from "node:test";
import assert from "node:assert/strict";
import { createBorrowsApi, borrowError, formatBorrowDate, createSubmissionGuard } from "../src/lib/borrows/core.js";
import { createAuthenticatedRequest } from "../src/lib/api/authenticated-request.js";
import { getApiUrl } from "../src/lib/api/url.js";
const id = "000000000000000000000001";
test("borrow sends only bookId with a fresh Bearer token; return uses DELETE without identity", async () => {
  const calls = []; let tokens = 0;
  const api = createBorrowsApi(createAuthenticatedRequest(async () => ({ data: { token: `test-${++tokens}` } }), async (url, options) => { calls.push({ url, ...options }); return Response.json({ success: true, data: { _id: id } }); }));
  await api.borrow(id); await api.returnBook(id);
  assert.equal(tokens, 2); assert.deepEqual(JSON.parse(calls[0].body), { bookId: id });
  assert.equal(calls[0].method, "POST"); assert.equal(calls[1].method, "DELETE"); assert.equal(calls[1].body, undefined);
  assert.equal(calls[1].headers.Authorization, "Bearer test-2"); assert.equal(calls[0].cache, "no-store");
});
test("history is paginated without any caller-supplied identity, including empty collections", async () => {
  let path; const api = createBorrowsApi(async value => { path = value; return { borrows: [], pagination: { page: 2, totalPages: 0 } }; });
  assert.deepEqual((await api.list(2)).borrows, []); assert.equal(path, "/borrows?page=2&limit=10");
  await assert.rejects(api.list(0)); await assert.rejects(api.list("1"));
});
test("malformed IDs cannot issue mutation requests", () => {
  const api = createBorrowsApi(() => assert.fail("must not fetch"));
  for (const value of [null, "bad", "../books", { $ne: null }]) { assert.throws(() => api.borrow(value)); assert.throws(() => api.returnBook(value)); }
});
test("invalid history response is rejected safely", async () => {
  for (const data of [{ borrows: {} }, { borrows: [], pagination: {} }]) await assert.rejects(createBorrowsApi(async () => data).list(), error => error.status === 502);
});
for (const [code, expected] of [["DUPLICATE_BORROW", "active loan"], ["BOOK_UNAVAILABLE", "No copies"], ["BORROW_ALREADY_RETURNED", "already been returned"]]) {
  test(`safe backend conflict mapping: ${code}`, async () => {
    const api = createBorrowsApi(createAuthenticatedRequest(async () => ({ data: { token: "test" } }), async () => Response.json({ success: false, error: { code, message: "PRIVATE diagnostic" } }, { status: 409 })));
    await assert.rejects(api.borrow(id), error => error.code === code && borrowError(error).includes(expected) && !borrowError(error).includes("PRIVATE"));
  });
}
test("unknown errors never echo server diagnostics", async () => {
  const request = createAuthenticatedRequest(async () => ({ data: { token: "test" } }), async () => Response.json({ error: { code: "PRIVATE", message: "PRIVATE" } }, { status: 500 }));
  await assert.rejects(request("/borrows"), error => error.code === undefined && !borrowError(error).includes("PRIVATE"));
});
test("unauthorized calls do not contact Borrow endpoints", async () => {
  const api = createBorrowsApi(createAuthenticatedRequest(async () => ({ error: { status: 401 } }), () => assert.fail("must not fetch")));
  await assert.rejects(api.list(), error => error.status === 401 && borrowError(error).includes("sign in"));
});
test("submission guard prevents concurrent borrow/return and unlocks after failure", async () => {
  const guard = createSubmissionGuard(); let resolve; let calls = 0;
  const first = guard(() => { calls++; return new Promise(r => { resolve = r; }); });
  await guard(() => { calls++; }); assert.equal(calls, 1); resolve(); await first;
  await assert.rejects(guard(() => { throw new Error("failure"); })); await guard(() => { calls++; }); assert.equal(calls, 2);
});
test("dates use authoritative server values with consistent UTC formatting", () => {
  assert.equal(formatBorrowDate("2026-11-05T23:59:59Z"), "Nov 5, 2026");
  for (const value of [undefined, null, "invalid"]) assert.equal(formatBorrowDate(value), "—");
});
test("URL helper allows only the existing Books and Borrow API families", () => {
  assert.equal(new URL(getApiUrl("/borrows?page=1")).pathname, "/borrows");
  for (const path of ["/borrowsevil", "/auth", "//example.test/borrows"]) assert.throws(() => getApiUrl(path));
});
