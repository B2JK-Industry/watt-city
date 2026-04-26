"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const LOCAL_KEY = "wc_cookie_consent_v1";

/* Essentials-only cookie-consent banner — Phase 6.2.1.
 *
 * We set exactly three cookies today:
 *  - xp-session (auth session)
 *  - wc_csrf (CSRF double-submit token)
 *  - lang (i18n preference)
 * All three are "strictly necessary" under the ePrivacy directive. We do
 * NOT set any tracking, advertising, or analytics cookies — analytics is
 * first-party server-side (Phase 5.3). So the banner's single "Accept"
 * button is informational; we can't actually turn the essentials off
 * without breaking the app. The banner exists to satisfy EU disclosure
 * obligations, not to offer an opt-out.
 */
export function CookieConsent({
  lang,
  hasBottomTabs = false,
}: {
  lang: Lang;
  /** True when the user is logged in and BottomTabs is rendering on
   *  mobile. The consent banner lifts above the 56-px tab row so it
   *  doesn't blanket-block the primary navigation before the user has
   *  had a chance to acknowledge cookies. */
  hasBottomTabs?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const acked = localStorage.getItem(LOCAL_KEY);
      if (!acked) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;
  const copy = {
    pl: {
      bodyShort: "Tylko niezbędne pliki cookie. Bez trackerów.",
      body: "Używamy tylko plików niezbędnych do działania: sesja, CSRF i język. Brak trackerów, brak reklam.",
      more: "Więcej",
      ok: "OK",
      ariaClose: "Zamknij komunikat o plikach cookie",
    },
    uk: {
      bodyShort: "Лише необхідні cookie. Без трекерів.",
      body: "Використовуємо лише необхідні файли: сесія, CSRF і мова. Без трекерів.",
      more: "Детальніше",
      ok: "OK",
      ariaClose: "Закрити повідомлення про cookie",
    },
    cs: {
      bodyShort: "Jen nezbytné cookie. Žádné trackery.",
      body: "Používáme jen nezbytné soubory: relace, CSRF a jazyk. Žádné trackery.",
      more: "Více",
      ok: "OK",
      ariaClose: "Zavřít oznámení o cookie",
    },
    en: {
      bodyShort: "Strictly-necessary cookies only. No trackers.",
      body: "We set only strictly-necessary cookies: session, CSRF, language. No trackers.",
      more: "More",
      ok: "OK",
      ariaClose: "Dismiss cookie notice",
    },
  }[lang];

  // On mobile + logged-in, lift the banner above the 56-px BottomTabs
  // row. Desktop (≥sm) never has BottomTabs so the CSS var resets to 0
  // via the responsive utility. `--cc-bot` is the computed bottom
  // offset; Tailwind arbitrary value reads it on mobile, sm: overrides.
  const bottomOffset = hasBottomTabs
    ? "calc(3.5rem + env(safe-area-inset-bottom, 0px))"
    : "env(safe-area-inset-bottom, 0px)";

  function ack() {
    try {
      localStorage.setItem(LOCAL_KEY, String(Date.now()));
    } catch {
      /* best-effort */
    }
    setVisible(false);
  }

  // Compact bottom-rail bar: single row even on mobile, terse copy that
  // never wraps on phones >= 360 px. Demo-review punch list flagged the
  // prior 4-line modal-feeling block as eating ~30 % of the hero on
  // first paint, killing the anonymous landing's first impression.
  return (
    <div
      role="region"
      aria-label="Cookies"
      aria-live="polite"
      style={{ ["--cc-bot" as string]: bottomOffset }}
      className="fixed inset-x-0 z-40 bottom-[var(--cc-bot)] sm:bottom-0 bg-[var(--surface)] border-t border-[var(--line)] elev-soft px-3 py-2 sm:px-5 sm:py-3 flex items-center gap-2 sm:gap-4"
    >
      <span aria-hidden className="hidden sm:inline text-base">🍪</span>
      <p className="flex-1 min-w-0 t-caption sm:t-body-sm text-[var(--ink-muted)] leading-snug">
        <span className="sm:hidden">{copy.bodyShort}</span>
        <span className="hidden sm:inline">{copy.body}</span>
      </p>
      <a
        href="/ochrana-sukromia"
        className="hidden sm:inline-flex btn btn-ghost btn-sm shrink-0"
      >
        {copy.more}
      </a>
      <button
        type="button"
        onClick={ack}
        className="btn btn-sm shrink-0"
      >
        {copy.ok}
      </button>
      <button
        type="button"
        onClick={ack}
        aria-label={copy.ariaClose}
        className="sm:hidden tap-target inline-flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--accent)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M3 3l10 10M13 3l-10 10" />
        </svg>
      </button>
    </div>
  );
}
