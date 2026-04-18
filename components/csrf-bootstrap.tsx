"use client";

import { useEffect } from "react";

/* Runs once on first client paint. Wraps window.fetch so that every
 * same-origin mutating request picks up the `wc_csrf` cookie and echoes
 * it as `X-CSRF-Token`. No component that uses plain `fetch(...POST)`
 * needs to be rewritten — CSRF just works.
 */
function cookieVal(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function CsrfBootstrap(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __wcCsrfPatched?: boolean };
    if (w.__wcCsrfPatched) return;
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const isMutating = ["POST", "PATCH", "PUT", "DELETE"].includes(method);
      if (!isMutating) return original(input, init);
      // Only attach for same-origin URLs. Cross-origin POSTs (if we ever do
      // them) must not leak the token.
      let url: URL;
      try {
        url =
          typeof input === "string"
            ? new URL(input, window.location.origin)
            : input instanceof URL
              ? input
              : new URL((input as Request).url, window.location.origin);
      } catch {
        return original(input, init);
      }
      if (url.origin !== window.location.origin) return original(input, init);
      const token = cookieVal("wc_csrf");
      if (!token) return original(input, init);
      const headers = new Headers(init?.headers ?? {});
      if (!headers.has("x-csrf-token")) headers.set("x-csrf-token", token);
      return original(input, { ...init, headers });
    };
    w.__wcCsrfPatched = true;
  }, []);
  return null;
}
