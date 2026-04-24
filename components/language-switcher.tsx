"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, LANG_FLAG, LANG_LABEL, type Lang } from "@/lib/i18n";

type Props = { current: Lang };

export function LanguageSwitcher({ current }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Lang | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function pick(lang: Lang) {
    if (lang === current || pending) return;
    setPending(lang);
    try {
      await fetch("/api/lang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang }),
      });
    } finally {
      // hard reload so server components re-render with new dict
      window.location.reload();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary btn-sm gap-1.5"
        aria-label={`Language: ${LANG_LABEL[current]}`}
      >
        <span className="text-base">{LANG_FLAG[current]}</span>
        <span className="hidden sm:inline">{current}</span>
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] min-w-[170px] z-30 rounded-md border border-[var(--line)] bg-[var(--surface)] p-1.5 flex flex-col gap-1 elev-soft">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => pick(lang)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm font-medium text-left ${
                lang === current
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "hover:bg-[var(--surface-2)] text-[var(--foreground)]"
              }`}
            >
              <span className="text-lg">{LANG_FLAG[lang]}</span>
              <span className="flex-1">{LANG_LABEL[lang]}</span>
              {pending === lang && <span className="opacity-60">…</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
