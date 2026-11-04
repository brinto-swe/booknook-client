"use client";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { bookSchema, bookDefaults, bookPayload, categories, isImageUrl } from "@/lib/books/schema";
import { booksApi } from "@/lib/books/api";
import { useBookError } from "./useBookResource";
import BookCover from "./BookCover";
export default function BookForm({ book, user, onSuccess, onBusy }) {
  const editing = Boolean(book);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const handleError = useBookError();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookSchema), defaultValues: bookDefaults(book),
  });
  const image = useWatch({ control, name: "image" });
  const field = (name, label, props = {}) => <div className="book-field"><label htmlFor={`book-${name}`}>{label}</label><input id={`book-${name}`} {...register(name, name === "totalCopies" ? { valueAsNumber: true } : {})} {...props} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} /><FieldError name={name} errors={errors} /></div>;
  async function submit(values) {
    if (lock.current) return;
    lock.current = true; onBusy?.(true); setError("");
    try {
      const payload = bookPayload(values);
      const result = editing ? await booksApi.update(book._id, payload) : await booksApi.create(payload);
      toast.success(editing ? "Book updated." : "Book added to the library.");
      onSuccess(result);
    } catch (failure) { const message = handleError(failure); setError(message); toast.error(message); }
    finally { lock.current = false; onBusy?.(false); }
  }
  return <form className="book-form" noValidate onSubmit={event => handleSubmit(submit)(event)} aria-busy={isSubmitting}>
    <fieldset disabled={isSubmitting}>
      <div className="book-form-grid">
        {field("title", "Book Title", { placeholder: "Enter book title", maxLength: 300 })}
        {field("author", "Author Name", { placeholder: "Enter author name", maxLength: 200 })}
        <div className="book-field"><label htmlFor="book-category">Category</label><select id="book-category" {...register("category")} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? "error-category" : undefined}><option value="">Select a category</option>{categories.map(category => <option key={category}>{category}</option>)}</select><FieldError name="category" errors={errors} /></div>
        {field("totalCopies", "Total Copies", { type: "number", min: 1, step: 1, inputMode: "numeric" })}
        <div className="book-full">{field("image", "Book Image URL", { type: "text", inputMode: "url", placeholder: "https://example.com/bm-cover.jpg", maxLength: 2048 })}<p className="book-hint">Use a direct HTTP or HTTPS image URL. No file upload needed.</p>{isImageUrl(image) && <BookCover src={image.trim()} className="book-preview" />}</div>
        <div className="book-field book-full"><label htmlFor="book-description">Short Description</label><textarea id="book-description" rows={4} maxLength={5000} placeholder="Tell readers a little about this book…" {...register("description")} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "error-description" : undefined} /><FieldError name="description" errors={errors} /></div>
        {!editing && <>{fieldReadonly("owner-name", "User Name", user?.name)}{fieldReadonly("owner-email", "User Email", user?.email)}</>}
      </div>
      {error && <p className="book-error" role="alert">{error}</p>}
      <button className="book-primary book-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}{isSubmitting ? "Saving…" : editing ? "Save Changes" : "Add Book"}</button>
    </fieldset>
  </form>;
}
function FieldError({ name, errors }) { return errors[name] ? <p className="book-field-error" id={`error-${name}`} role="alert">{errors[name].message}</p> : null; }
function fieldReadonly(id, label, value) { return <div className="book-field"><label htmlFor={id}>{label}</label><input id={id} readOnly value={value || ""} /><span className="book-hint">From your signed-in account</span></div>; }
