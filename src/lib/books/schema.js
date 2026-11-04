import { z } from "zod";
export const categories = ["Fiction", "Science", "History", "Kids", "Others"];
export function isImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
export const bookSchema = z.strictObject({
  title: z.string().trim().min(1, "Enter a book title.").max(300),
  author: z.string().trim().min(1, "Enter the author’s name.").max(200),
  category: z.enum(categories, { error: "Choose a category." }),
  totalCopies: z.number({ error: "Enter a number of copies." }).int("Use a whole number.").min(1, "At least one copy is required.").max(Number.MAX_SAFE_INTEGER),
  image: z.string().trim().refine(isImageUrl, "Enter an HTTP or HTTPS image URL without credentials."),
  description: z.string().trim().min(1, "Enter a short description.").max(5000),
});
// Explicit allowlist; identity, availability and dates never leave the form.
export function bookPayload(values) {
  return bookSchema.parse(Object.fromEntries(["title","author","category","totalCopies","image","description"].map(key => [key, values[key]])));
}
export function bookDefaults(book = {}) {
  return { title: book.title ?? "", author: book.author ?? "", category: book.category ?? "",
    totalCopies: book.totalCopies ?? 1, image: book.image ?? book.imageUrl ?? "", description: book.description ?? "" };
}
