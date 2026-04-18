import type { NextConfig } from "next";

/* Security headers applied to every HTML response (Phase 6.1.5 + 6.5.5).
 *
 * CSP notes:
 *  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — Next injects inline
 *    scripts for hydration data + uses eval in dev. A nonce-based strategy
 *    would be stricter but requires custom middleware; deferred.
 *  - `connect-src 'self'` — all API calls are same-origin.
 *  - `img-src 'self' data: blob:` — inline SVG + favicon + generated blobs.
 *  - `frame-ancestors 'none'` — prevent clickjacking.
 *
 * Caching (Phase 6.5.5):
 *  - `/_next/static/*` gets a 1-year immutable cache (handled by Next).
 *  - `/favicon.ico` + `/icons/*` get explicit long cache via headers().
 */

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const STATIC_CACHE_HEADERS = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/icons/:path*",
        headers: STATIC_CACHE_HEADERS,
      },
      {
        source: "/favicon.ico",
        headers: STATIC_CACHE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
