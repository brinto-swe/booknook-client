"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { booksApi } from "@/lib/books/api";
import { loginRedirectURL } from "@/lib/auth-ui/redirects";
export function useBookError() {
  const router = useRouter();
  const pathname = usePathname();
  return error => {
    if (error.status === 401) router.replace(loginRedirectURL(pathname + window.location.search));
    return error.message || "The library is unavailable. Please try again.";
  };
}
export function useBookResource(kind, value) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const data = await booksApi[kind](value, controller.signal);
        if (!controller.signal.aborted) setState({ loading: false, data, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error.status === 401) router.replace(loginRedirectURL(pathname + window.location.search));
        setState({ loading: false, data: null, error });
      }
    };
    load();
    return () => controller.abort();
  }, [kind, value, revision, router, pathname]);
  return { ...state, refresh() { setState({ loading: true, data: null, error: null }); setRevision(r => r + 1); } };
}
