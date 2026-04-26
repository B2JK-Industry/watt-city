import Link from "next/link";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

/* G-04 — informational `/consent` page.
 *
 * cookie-consent.tsx (`Více / More` link) used to point at
 * /ochrana-sukromia (the long privacy policy). After the banner
 * audit confirmed we ship exactly 3 strictly-necessary cookies and
 * no analytics/tracking, the right surface for the "More" CTA is a
 * focused informational page that lists those 3 cookies + their
 * purpose + lifetime. Privacy policy stays the secondary deep-link.
 */
export default async function ConsentPage() {
  const lang = await getLang();
  const t = dictFor(lang).consent;
  const cookies = [
    {
      name: "xp-session",
      purpose: t.cookieSessionPurpose,
      duration: t.cookieDurationSession,
    },
    {
      name: "wc_csrf",
      purpose: t.cookieCsrfPurpose,
      duration: t.cookieDurationSession,
    },
    {
      name: "xp_lang",
      purpose: t.cookieLangPurpose,
      duration: t.cookieDuration1y,
    },
  ];
  return (
    <main className="max-w-2xl mx-auto card p-6 flex flex-col gap-4 animate-slide-up">
      <h1 className="t-h2 text-[var(--accent)]">{t.title}</h1>
      <p className="text-[var(--ink-muted)]">{t.intro}</p>
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--ink-muted)] border-b border-[var(--line)]">
          <tr>
            <th className="text-left p-2">{t.colName}</th>
            <th className="text-left p-2">{t.colPurpose}</th>
            <th className="text-left p-2">{t.colDuration}</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((c) => (
            <tr key={c.name} className="border-b border-[var(--line)]">
              <td className="p-2 font-mono">{c.name}</td>
              <td className="p-2">{c.purpose}</td>
              <td className="p-2 text-[var(--ink-muted)]">{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="t-caption text-[var(--ink-muted)]">{t.optOutBody}</p>
      <Link href="/ochrana-sukromia" className="btn btn-secondary self-start">
        {t.privacyPolicy}
      </Link>
    </main>
  );
}
