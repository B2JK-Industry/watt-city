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
export function CookieConsent({ lang }: { lang: Lang }) {
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
      body:
        "Używamy tylko plików niezbędnych do działania: sesja, CSRF i język. Brak trackerów, brak reklam.",
      more: "Więcej",
      ok: "Rozumiem",
    },
    uk: {
      body: "Використовуємо лише необхідні файли: сесія, CSRF і мова. Без трекерів.",
      more: "Детальніше",
      ok: "Ок",
    },
    cs: {
      body: "Používáme jen nezbytné soubory: relace, CSRF a jazyk. Žádné trackery.",
      more: "Více",
      ok: "Rozumím",
    },
    en: {
      body: "We set only strictly-necessary cookies: session, CSRF, language. No trackers.",
      more: "More",
      ok: "Got it",
    },
  }[lang];

  // Bottom offset: on <sm sit ABOVE BottomTabs (h-14 = 3.5rem + safe-area
   // inset) so primary mobile nav stays reachable while the banner is up.
   // On sm+ we don't render BottomTabs so bottom-0 is fine.
  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0))] sm:bottom-0 inset-x-0 z-40 bg-[var(--background)] border-t-[3px] border-[var(--ink)] p-3 sm:p-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
    >
      <p className="flex-1 text-zinc-300">{copy.body}</p>
      <div className="flex gap-2 flex-wrap">
        <a href="/ochrana-sukromia" className="btn btn-ghost text-xs">
          {copy.more}
        </a>
        <button
          className="btn btn-primary text-xs"
          onClick={() => {
            try {
              localStorage.setItem(LOCAL_KEY, String(Date.now()));
            } catch {
              /* best-effort */
            }
            setVisible(false);
          }}
        >
          {copy.ok}
        </button>
      </div>
    </div>
  );
}
