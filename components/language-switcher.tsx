"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGS, LANG_FLAG, LANG_LABEL, type Lang } from "@/lib/i18n";

type Variant = "header" | "drawer";

type Props = {
  current: Lang;
  /** `header` (default) renders a compact 44×44 trigger that opens an
   *  anchored dropdown — used in `SiteNav`. `drawer` renders an inline
   *  segmented row of language chips that always switches on tap; used
   *  inside the mobile drawer where vertical space is plentiful and we
   *  want zero hidden-state. */
  variant?: Variant;
};

/* Localised a11y labels — the dropdown previously announced itself in
 * English regardless of the active locale. Screen-reader users on the
 * PL/UK/CS sites now hear the label in their language. */
const A11Y_LABELS: Record<
  Lang,
  { trigger: string; listbox: string; group: string }
> = {
  pl: { trigger: "Język:", listbox: "Wybór języka", group: "Wybór języka" },
  uk: { trigger: "Мова:", listbox: "Вибір мови", group: "Вибір мови" },
  cs: { trigger: "Jazyk:", listbox: "Volba jazyka", group: "Volba jazyka" },
  en: { trigger: "Language:", listbox: "Language", group: "Language" },
};

export function LanguageSwitcher({ current, variant = "header" }: Props) {
  const router = useRouter();
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
      // Soft transition — `router.refresh()` re-runs the server tree
      // (server components, layout, page) with the new `xp_lang`
      // cookie and patches the rendered DOM in place. The previous
      // `window.location.reload()` killed scroll position, blanked
      // the page, and visibly re-mounted client islands; this swap
      // looks like a language change, not an app crash.
      router.refresh();
      setOpen(false);
    } finally {
      setPending(null);
    }
  }

  if (variant === "drawer") {
    // Inline segmented row, no popover — the drawer already gives us a
    // dedicated surface so collapsing language behind a second click
    // would be a regression in touch UX. Each tap is 44×44 by virtue of
    // `tap-target`.
    return (
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={A11Y_LABELS[current].group}
      >
        {LANGS.map((lang) => {
          const isActive = lang === current;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => pick(lang)}
              aria-pressed={isActive}
              aria-label={LANG_LABEL[lang]}
              className={`tap-target inline-flex items-center justify-center gap-1.5 rounded-md px-3 transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-ink)] font-semibold"
                  : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface-2))]"
              }`}
            >
              <span className="text-lg leading-none">{LANG_FLAG[lang]}</span>
              <span className="text-sm uppercase tracking-wide">{lang}</span>
              {pending === lang && <span className="opacity-60">…</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-target inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        aria-label={`${A11Y_LABELS[current].trigger} ${LANG_LABEL[current]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{LANG_FLAG[current]}</span>
        <span className="hidden lg:inline">{current}</span>
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={A11Y_LABELS[current].listbox}
          className="absolute right-0 top-[calc(100%+6px)] min-w-[170px] z-30 rounded-md border border-[var(--line)] bg-[var(--surface)] p-1.5 flex flex-col gap-1 elev-soft"
        >
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => pick(lang)}
              role="option"
              aria-selected={lang === current}
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
