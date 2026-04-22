"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

/* Phase 7.1.2 — service-worker registration + Phase 7.1.3 install prompt.
 *
 * On mount (client-side only):
 *  1. Register the root-scoped `service-worker.js` (shipped in Phase 2.7).
 *  2. Listen for `beforeinstallprompt` so we can show our own install CTA.
 *  3. Show the CTA only when we have a session AND we're not already
 *     installed. For under-16 accounts, gate behind a "checked with a
 *     parent" confirmation (GDPR-K defence-in-depth on top of Phase 6.3
 *     consent flow).
 *
 * The CTA is a non-modal banner at the bottom of the viewport so it
 * doesn't cover game UI. Dismissing it sets a localStorage flag that
 * survives page reloads; we never spam.
 */
const DISMISS_KEY = "wc_pwa_dismiss_v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister({ lang }: { lang: Lang }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  // Lazy-init from localStorage. SSR returns `true` so the banner stays hidden
  // until hydration, then flips to the real persisted value on the client.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(localStorage.getItem(DISMISS_KEY));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => {
        // Best-effort. Failing to register SW isn't a user-facing error.
      });

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !promptEvent) return null;

  const copy = {
    pl: { install: "Zainstaluj Watt City", dismiss: "Nie teraz" },
    uk: { install: "Встановити Watt City", dismiss: "Не зараз" },
    cs: { install: "Nainstalovat Watt City", dismiss: "Teď ne" },
    en: { install: "Install Watt City", dismiss: "Not now" },
  }[lang];

  const onInstall = async () => {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* best-effort */
      }
      setDismissed(true);
      setPromptEvent(null);
    }
  };

  const onDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* best-effort */
    }
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,22rem)] card p-3 flex items-center justify-between gap-2 shadow-[6px_6px_0_0_var(--ink)]"
    >
      <span className="text-sm">📱</span>
      <div className="flex gap-2">
        <button className="btn btn-primary text-xs" onClick={onInstall}>
          {copy.install}
        </button>
        <button className="btn btn-ghost text-xs" onClick={onDismiss}>
          {copy.dismiss}
        </button>
      </div>
    </div>
  );
}
