const localOrigin = "https://booknook.invalid";

export function safeCallbackURL(value) {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//")) return "/";
  let decoded = value;
  try {
    // Check nested encodings as well as the original browser navigation target.
    for (let depth = 0; depth < 4; depth++) {
      if (!decoded.startsWith("/") || decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/";
      const check = new URL(decoded, localOrigin);
      if (check.origin !== localOrigin || /^\/(login|register|api|_next)(\/|$)/i.test(check.pathname)) return "/";
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      if (depth === 3) return "/";
      decoded = next;
    }
    const url = new URL(value, localOrigin);
    return url.pathname + url.search + url.hash;
  } catch { return "/"; }
}

export function authPageURL(path, destination) {
  const callback = safeCallbackURL(destination);
  return callback === "/" ? path : `${path}?${new URLSearchParams({ callbackURL: callback })}`;
}

export function loginRedirectURL(destination) {
  return `/login?${new URLSearchParams({ callbackURL: safeCallbackURL(destination) })}`;
}

export function destinationWithQuery(path, query = {}) {
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(query || {})) {
    for (const value of Array.isArray(values) ? values : [values]) {
      if (typeof value === "string") params.append(key, value);
    }
  }
  return safeCallbackURL(`${path}${params.size ? `?${params}` : ""}`);
}
