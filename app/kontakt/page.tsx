import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { ContactForm } from "@/components/contact-form";

/* G-02 — `/kontakt` page. Server component for header + intro,
 * delegates the form to the ContactForm client primitive. */
export const dynamic = "force-dynamic";

export default async function KontaktPage() {
  const lang = await getLang();
  const t = dictFor(lang).kontakt;
  return (
    <main className="max-w-2xl mx-auto flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="t-h2 text-[var(--accent)]">{t.title}</h1>
        <p className="text-[var(--ink-muted)]">{t.intro}</p>
      </header>
      <ContactForm variant="general" lang={lang} dict={t} />
    </main>
  );
}
