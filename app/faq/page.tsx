import Link from "next/link";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

/* G-02 — `/faq` informational page.
 *
 * Pre-PR-P the footer carried "FAQ — wkrótce / brzy / soon" disabled
 * placeholders for 4 locales. This page replaces them with 6 real
 * Q&A items per locale (`dict.faq.items`). Server component so the
 * locale picks up correctly through `xp_lang` cookie.
 */
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const lang = await getLang();
  const t = dictFor(lang).faq;
  return (
    <main className="max-w-3xl mx-auto flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="t-h2 text-[var(--accent)]">{t.title}</h1>
        <p className="text-[var(--ink-muted)]">{t.intro}</p>
      </header>
      <section className="flex flex-col gap-3">
        {t.items.map((item, i) => (
          <details
            key={i}
            className="card p-5 group"
            // First item open by default for scannability.
            {...(i === 0 ? { open: true } : {})}
          >
            <summary className="cursor-pointer flex items-baseline justify-between gap-3 list-none">
              <span className="font-semibold text-[var(--foreground)]">
                {item.q}
              </span>
              <span
                aria-hidden
                className="text-[var(--accent)] transition-transform group-open:rotate-45 select-none text-xl leading-none"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[var(--ink-muted)] leading-relaxed whitespace-pre-line">
              {item.a}
            </p>
          </details>
        ))}
      </section>
      <p className="text-sm text-[var(--ink-muted)]">
        {t.contactCta}{" "}
        <Link href="/kontakt" className="text-[var(--accent)] underline">
          {t.contactLinkLabel}
        </Link>
        .
      </p>
    </main>
  );
}
