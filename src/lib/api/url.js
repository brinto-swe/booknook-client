export function getApiUrl(path) {
  const origin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  let url;
  try { url = new URL(path, origin); } catch { throw new Error("Invalid public API URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password
    || url.origin !== new URL(origin).origin || !path.startsWith("/books")) throw new Error("Invalid public API URL.");
  return url.toString();
}
