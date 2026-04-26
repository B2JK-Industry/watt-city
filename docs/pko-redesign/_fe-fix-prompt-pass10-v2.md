# Sprint G — surgical edition (Pass-10 v2)

**Vstup:** product-visionar deep-audit počas FE shipnutia Sprint F (PR-N), 14 routes preskúmaných + code audit. Toto je **surgical edition** kde každý finding má exact file:line + exact code snippet + exact fix patch.

**Diff oproti Pass-10 v1:**
- ❌ G-09 (`/marketplace` obsah) — **REMOVED**, false positive (`app/marketplace/page.tsx:14-44` má proper "Tier 7+" lock state s CTA)
- ❌ G-12 (`cashflow-hud.tsx` JSON.parse) — **REMOVED**, false positive (riadky 130-135 majú try-catch)
- ❌ G-13 (division by zero) — **REMOVED**, false positive (`curriculum-chart.tsx:35` má `if (c.total === 0) return null`, `live-countdown.tsx:40` má `Math.max(0, validUntil - now)`)
- ✅ G-01 spresnená — exact range fix v auth-form + register route + multilingual labels
- ✅ G-04 zmenená — `/consent` ako **informational** page (nie management toggle, lebo banner je informational-only per cookie-consent.tsx:14-26)
- ✅ G-05 rozšírená — 7 Slovak v `/o-platforme` + 4 PL hardcoded v `auth-form.tsx` + 1 EN v `register/page.tsx:28`
- ✅ G-08 spresnená — per-game pages **existujú** (`app/games/<id>/page.tsx` × 9 evergreen + 1 AI), treba doplniť hero info, nie celý refactor

**Reviewer:** product visionar. Schválim PR-O keď: walkthrough 0 axe-core findings, manual smoke prejde 7 specific kontrol, security audit (G-01 + G-14) potvrdí že child product spĺňa GDPR-K.

---

## 0 · Pre-flight

```bash
git status                                  # clean (post Sprint F PR-N merge)
git log --oneline -5                        # potvrď že PR-N je shipped
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test    # baseline
WALKTHROUGH_LABEL=pre-pr-o pnpm test:walk
```

---

## 🔴 CRITICAL · 5 issues

### G-01 · `/register` — 7 surgical patches pre regulatory + UX safety

**File:** `components/auth-form.tsx`

**Problémy zoradené:**

**Patch 1 — Birth year range** (riadok 99):
```tsx
// BEFORE
{Array.from({ length: 90 }, (_, i) => currentYear - 5 - i).map((y) => (
  <option key={y} value={y}>{y}</option>
))}

// AFTER — 11 entries, 6-16 vekový buffer pre cieľovku 9-14
{Array.from({ length: 11 }, (_, i) => currentYear - 6 - i).map((y) => (
  <option key={y} value={y}>{y}</option>
))}
```
Range: `currentYear-6` (najmladší 7) → `currentYear-16` (najstarší 17). Zachová parent-consent flow pre under-16.

**Patch 2 — Password minLength + pattern** (riadok 82-83):
```tsx
// BEFORE
required
minLength={6}
maxLength={200}

// AFTER
required
minLength={8}
maxLength={200}
pattern="(?=.*[a-zA-Z])(?=.*\d).{8,}"
title={t.passwordTitle}
```
Pridať `t.passwordTitle` do `lib/locales/{pl,uk,cs,en}.ts` `auth.passwordTitle`:
- pl: `"Min. 8 znaków, w tym 1 litera i 1 cyfra"`
- uk: `"Мін. 8 символів, 1 літера і 1 цифра"`
- cs: `"Min. 8 znaků, 1 písmeno a 1 číslice"`
- en: `"Min. 8 chars, 1 letter and 1 digit"`

**Patch 3 — Hardcoded PL labels** (riadky 32, 89, 109, 117):
```tsx
// BEFORE riadok 32
setError("Podaj rok urodzenia.");
// AFTER
setError(t.errorBirthYearMissing);

// BEFORE riadok 89
<span className="t-body-sm text-[var(--ink-muted)]">Rok urodzenia (RODO-K)</span>
// AFTER
<span className="t-body-sm text-[var(--ink-muted)]">{t.birthYearLabel}</span>

// BEFORE riadok 109
<span className="t-body-sm text-[var(--ink-muted)]">
  E-mail rodzica (wymagane dla &lt; 16 lat)
</span>
// AFTER
<span className="t-body-sm text-[var(--ink-muted)]">{t.parentEmailLabel}</span>

// BEFORE riadok 117
placeholder="rodzic@example.com"
// AFTER
placeholder={t.parentEmailPlaceholder}
```

Pridať do dict.auth × 4 jazyky:
- `errorBirthYearMissing`: pl `"Podaj rok urodzenia."` / uk `"Вкажи рік народження."` / cs `"Zadej rok narození."` / en `"Enter your birth year."`
- `birthYearLabel`: pl `"Rok urodzenia (RODO-K)"` / uk `"Рік народження (GDPR-K)"` / cs `"Rok narození (GDPR-K)"` / en `"Birth year (GDPR-K)"`
- `parentEmailLabel`: pl `"E-mail rodzica (wymagane dla < 16 lat)"` / uk `"Email батьків (потрібно для віку < 16)"` / cs `"E-mail rodiče (povinný pro < 16 let)"` / en `"Parent's email (required for under 16)"`
- `parentEmailPlaceholder`: pl `"rodzic@example.com"` / uk `"батько@example.com"` / cs `"rodic@example.com"` / en `"parent@example.com"`

**Patch 4 — Server-side birth year clamp** v `app/api/auth/register/route.ts:31-36`:
```ts
// BEFORE
birthYear: z.number().int().min(1900).max(CURRENT_YEAR).optional(),

// AFTER
birthYear: z
  .number()
  .int()
  .min(CURRENT_YEAR - 16)   // max 16 rokov
  .max(CURRENT_YEAR - 6)    // min 7 rokov
  .optional(),
```

Plus update error message v `app/api/auth/register/route.ts:91-93`:
```ts
// BEFORE
{ ok: false, error: "Podaj rok urodzenia (wymagane przez RODO-K)." }

// AFTER
{ ok: false, error: parsed.error.issues.[0]?.message ?? "Invalid birth year" }
```

**Patch 5 — Register chip title hardcoded EN** v `app/register/page.tsx:28`:
```tsx
// BEFORE
<span className="chip" title="GDPR-K compliant — automatic parental consent under 16">
  🔒 GDPR-K
</span>

// AFTER
<span className="chip" title={t.gdprKTooltip}>
  🔒 GDPR-K
</span>
```
Pridať `t.gdprKTooltip` × 4 jazyky.

**Patch 6 — Test pre register validation** `app/api/auth/register/register-validation.test.ts` (NEW):
```ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("/api/auth/register validation", () => {
  it("rejects birthYear too old (< CURRENT_YEAR - 16)", async () => {
    const req = new Request("http://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "test", password: "Pass1234", birthYear: 2000 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects birthYear too young (> CURRENT_YEAR - 6)", async () => {
    const req = new Request("http://x/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "test", password: "Pass1234", birthYear: 2022 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("requires parentEmail for under-16", async () => {
    // ... verify needsConsent flow
  });
});
```

**Patch 7 — UI password strength live indicator** (optional, nice-to-have):
Pod password input pridať checklist:
```tsx
{mode === "register" && password.length > 0 && (
  <ul className="t-caption text-[var(--ink-muted)] flex flex-col gap-0.5">
    <li className={password.length >= 8 ? "text-[var(--success)]" : ""}>
      {password.length >= 8 ? "✓" : "○"} {t.pwRule8chars}
    </li>
    <li className={/[a-zA-Z]/.test(password) ? "text-[var(--success)]" : ""}>
      {/[a-zA-Z]/.test(password) ? "✓" : "○"} {t.pwRuleLetter}
    </li>
    <li className={/\d/.test(password) ? "text-[var(--success)]" : ""}>
      {/\d/.test(password) ? "✓" : "○"} {t.pwRuleDigit}
    </li>
  </ul>
)}
```

**Quality gate:**
- `pnpm test components/auth-form.test.tsx` — 3 nové unit testy (range clamp, password rules, i18n labels)
- Manual smoke: `/register` → birth year dropdown má 11 entries (2010-2020 ak today=2026), žiadny 1932 / 2021
- Manual smoke: pokus registrovať s password `"abc12"` → form blokuje (HTML5 pattern validation)

---

### G-02 · Site footer "FAQ wkrótce / Kontakt wkrótce" — 4 jazykov hardcoded

**File:** `components/site-footer.tsx:35-59`

**Aktuálny stav** (4 langs):
```tsx
// pl
faq: "FAQ — wkrótce",
contact: "Kontakt — wkrótce",
// cs
faq: "FAQ — brzy",
contact: "Kontakt — brzy",
// uk + en analogous
```

**ROZHODNUTIE PRE PO** (musí potvrdiť pred FE štartom):

**Option A — implementovať FAQ + Kontakt page (preferované, ~4-6h FE work):**

Vytvoriť `app/faq/page.tsx`:
```tsx
import { getLang } from "@/lib/i18n-server";
import { dictFor } from "@/lib/i18n";
// minimal page so 6-10 FAQ items per-Lang
const FAQ: Record<Lang, { q: string; a: string }[]> = {
  pl: [
    { q: "Jak działa Watt City?", a: "..." },
    { q: "Czy to prawdziwe pieniądze?", a: "Nie. Wszystko (Watty, kredyty, budynki) istnieje tylko w grze." },
    { q: "Mam mniej niż 16 lat — czy mogę grać?", a: "Tak, ale potrzebujemy zgody rodzica..." },
    { q: "Jak chronicie moje dane?", a: "GDPR-K + EU hosting. Szczegóły: /ochrana-sukromia." },
    { q: "Mogę grać bez konta?", a: "Tak — kliknij 'Demo' na stronie głównej..." },
    { q: "Co to PKO XP: Gaming?", a: "..." },
  ],
  uk: [/* 6 items */],
  cs: [/* 6 items */],
  en: [/* 6 items */],
};
```

Vytvoriť `app/kontakt/page.tsx`:
```tsx
"use client";

import { useState } from "react";
// minimal contact form: name, email, topic, message
// POST /api/contact → email/Slack notification
```

Plus `app/api/contact/route.ts`:
```ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  topic: z.enum(["general", "bug", "school", "press", "privacy"]),
  message: z.string().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`contact:${clientIp(req)}`, 3, 60_000);
  if (!rl.ok) return Response.json({ ok: false, error: "rate-limited" }, { status: 429 });
  // ... send email or Slack webhook
}
```

Update site-footer.tsx HELP_LABELS na linky:
```tsx
faq: { label: "FAQ", href: "/faq" },
contact: { label: "Kontakt", href: "/kontakt" },
```

**Option B — hide placeholders (15 min):**

Odstrániť `faq` + `contact` z `HELP_LABELS` typed Record × 4 langs (riadky 41-42, 51-52, 56-57, 46-47). Plus odstrániť ich render v footer JSX.

**Quality gate:**
- (A) Walkthrough všetkých 14 routes — žiadne "wkrótce / brzy / coming soon" v footer; `/faq` a `/kontakt` loadujú so 6+ items resp. funkčný formulár
- (A) Manual smoke: kontakt form → email arrives na test inbox
- (B) Walkthrough — footer obsahuje len `compareLoans` link + brand block

---

### G-03 · Žiadne error boundaries mimo `/miasto`

**Aktuálne existujúce súbory:**
```bash
$ find app -name "error.tsx" -o -name "global-error.tsx" -o -name "not-found.tsx"
app/miasto/error.tsx
```

**Chýbajúce 4 súbory** — vytvoriť všetky v PR-O:

**1. `app/error.tsx`** (NEW — root segment fallback):
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[root] runtime error:", error);
  }, [error]);
  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl" aria-hidden>⚠️</span>
      <h1 className="t-h2">Něco se pokazilo</h1>
      <p className="text-[var(--ink-muted)]">Nepodařilo se načíst stránku. Zkusíme to znovu.</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Zkusit znovu
        </button>
        <Link href="/" className="btn btn-secondary">Zpět na úvod</Link>
      </div>
      {error.digest && <p className="text-xs text-[var(--ink-muted)] font-mono">{error.digest}</p>}
    </main>
  );
}
```

**2. `app/global-error.tsx`** (NEW — catastrophic root layout fallback):
```tsx
"use client";

export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: 32, textAlign: "center" }}>
        <h2>Aplikácia nefunguje</h2>
        <p>Nastala neočakávaná chyba. Skús obnoviť stránku.</p>
        <button type="button" onClick={() => reset()}>Obnoviť</button>
        {error.digest && <p style={{ fontSize: 12, opacity: 0.5 }}>{error.digest}</p>}
      </body>
    </html>
  );
}
```

**3. `app/not-found.tsx`** (NEW — root 404):
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl" aria-hidden>🔍</span>
      <h1 className="t-h2">Tato stránka neexistuje</h1>
      <p className="text-[var(--ink-muted)]">Možná byla přesunuta nebo špatně napsaná adresa.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn btn-primary">Zpět na úvod</Link>
        <Link href="/games" className="btn btn-secondary">Hry</Link>
      </div>
    </main>
  );
}
```

**4. `app/games/[id]/not-found.tsx`** (NEW — segment-specific 404):
```tsx
import Link from "next/link";
import { GAMES } from "@/lib/games";

export default function GameNotFound() {
  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl" aria-hidden>🎮</span>
      <h1 className="t-h2">Tato hra neexistuje</h1>
      <p className="text-[var(--ink-muted)]">Vyber si z {GAMES.length} dostupných miniher.</p>
      <Link href="/games" className="btn btn-primary">Všechny hry</Link>
    </main>
  );
}
```

**Per-Lang strings:** Všetky text strings v týchto 4 súboroch musia byť per-Lang cez `getLang()` server-side. Pre tento spec uvádzam `cs` ako default, pridať keys do `lib/locales/{pl,uk,cs,en}.ts`:
- `error.title`, `error.body`, `error.retry`, `error.back`
- `notFound.title`, `notFound.body`, `notFound.backHome`, `notFound.allGames`

**Quality gate:**
- Manual smoke: `/games/foo` → custom 404 (nie generic Vercel "404 NOT_FOUND" page)
- Manual smoke: `/games/ai/invalid` → custom 404
- Manual smoke: throw mock error v `/games` → `app/error.tsx` zobrazí, žiadny browser-level page
- Vitest `app/error.test.tsx` (NEW) — render error.tsx s mock error, klik retry calls reset()

---

### G-04 · `/consent` 404 — REVIDOVANÉ ako informational page

**Pôvodný spec navrhoval consent management toggle. Revízia po `cookie-consent.tsx:14-26` audit:**

> "We set exactly three cookies today: xp-session (auth session), wc_csrf (CSRF), lang (i18n). All three are 'strictly necessary' under the ePrivacy directive. We do NOT set any tracking, advertising, or analytics cookies. So the banner's single 'Accept' button is informational; we can't actually turn the essentials off without breaking the app."

→ **Žiadny analytics/marketing cookie nie je čo manage-ovať**. `/consent` page má byť **informational** so listing toho, čo cookies robia.

**Vytvoriť `app/consent/page.tsx`** (server component, per-Lang):
```tsx
import { getLang } from "@/lib/i18n-server";
import { dictFor } from "@/lib/i18n";
import Link from "next/link";

export default async function ConsentPage() {
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.consent;
  const cookies = [
    { name: "xp-session", purpose: t.cookieSessionPurpose, durationLabel: t.cookieDurationSession, required: true },
    { name: "wc_csrf", purpose: t.cookieCsrfPurpose, durationLabel: t.cookieDurationSession, required: true },
    { name: "lang", purpose: t.cookieLangPurpose, durationLabel: t.cookieDuration1y, required: true },
  ];

  return (
    <main className="max-w-2xl mx-auto card p-6 flex flex-col gap-4">
      <h1 className="t-h2">{t.title}</h1>
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
              <td className="p-2 text-[var(--ink-muted)]">{c.durationLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="t-body-sm text-[var(--ink-muted)]">{t.optOutBody}</p>
      <Link href="/ochrana-sukromia" className="btn btn-secondary self-start">
        {t.privacyPolicy}
      </Link>
    </main>
  );
}
```

**Pridať `dict.consent` do `lib/locales/{pl,uk,cs,en}.ts`** so 9 keys (title, intro, colName/Purpose/Duration, cookieSession/Csrf/Lang Purpose, cookieDurationSession/1y, optOutBody, privacyPolicy).

**Update `cookie-consent.tsx`** — banner footer link na `/consent` (riadok 200-205):
```tsx
// BEFORE
<a href="/ochrana-sukromia" className="hidden sm:inline-flex btn btn-ghost btn-sm shrink-0">
  {copy.more}
</a>

// AFTER
<Link href="/consent" className="hidden sm:inline-flex btn btn-ghost btn-sm shrink-0">
  {copy.more}
</Link>
```

(Mobile inline link na riadku 178-184 ostáva — pôjde rovno na ochrana-sukromia, alebo update tiež.)

**Quality gate:**
- Manual smoke: `/consent` loaduje, ukazuje 3 cookies + popis
- Manual smoke: cookie banner "Více / More" link → `/consent` (NIE `/ochrana-sukromia` — to ostáva primary policy)

---

### G-05 · 12 hardcoded Slovak/PL/EN strings v UI components

**12 exact lokácií** auditovaných:

**A) `app/o-platforme/page.tsx` — 7 hardcoded Slovak strings:**

| Line | Aktuálny string (Slovak) | Treba PL ekvivalent |
|------|--------------------------|---------------------|
| 287 | `Vďaka: PKO Bank Polski · Tauron · ETHWarsaw · AKMF · Katowicki.Hub.` | `Dziękujemy: PKO Bank Polski · Tauron · ETHWarsaw · AKMF · Katowicki.Hub.` |
| 392 | `note="Vstupná + AI-output validácia."` | `note="Walidacja wejść + outputu AI."` |
| 393 | `note="Heslá + HTTP-only signed session cookie."` | `note="Hasła + HTTP-only signed session cookie."` |
| 395 | `note="Claude Sonnet 4.6 (PL gen) + Haiku 4.5 (3× preklad), JSON structured output."` | `note="Claude Sonnet 4.6 (gen PL) + Haiku 4.5 (3× tłumaczenie), JSON structured output."` |
| 396 | `name="SVG, žiadne PNG/JPG" note="Celé mestečko + budova sú vektor, ostrý na 4K."` | `name="SVG, żadnych PNG/JPG" note="Całe miasteczko + budynki są wektorem, ostre na 4K."` |
| 452 | `<Link href="/">Späť na domov</Link>` | `<Link href="/">Wróć na stronę główną</Link>` |
| 453 | `<Link href="/ochrana-sukromia">Ochrana súkromia</Link>` | `<Link href="/ochrana-sukromia">Ochrona prywatności</Link>` |

**Plus per-Lang variants** pre uk/cs/en (každú line treba per-Lang). Súbor `app/o-platforme/page.tsx` má `t.web3Title` etc., takže má dict-pattern. Treba audit či tieto 7 stringov sú v `dict.aboutPlatform` alebo hardcoded inline. **Predpoklad:** hardcoded inline (preto leak); presunúť do `lib/locales/{pl,uk,cs,en}.ts` `aboutPlatform.thanks/footer/techNotes`.

**B) `components/auth-form.tsx` — 4 hardcoded PL strings** (Patch 3 z G-01 ich už adresuje):
- riadok 32, 89, 109, 117

**C) `app/register/page.tsx:28` — 1 hardcoded EN string** (Patch 5 z G-01 ho adresuje):
- chip title `"GDPR-K compliant — automatic parental consent under 16"`

**Plus audit grep — najsť ostatné hardcoded strings:**
```bash
# Hľadaj capitalized words v components/ ktoré sú user-facing strings ale nie sú v {t.xxx} alebo dict[lang]
grep -rnE '"[A-ZŁŃÓŚŻŹĄĆĘ][a-zł[a-ząćęłńóśźżµ\s]+"' components | grep -v "className\|aria-\|title=\|href=\|d=\|fill=\|stroke=" | head
```
Add findings do PR-O description.

**Quality gate:**
- `app/o-platforme` v PL session — žiadne `Vďaka, Späť, žiadne PNG, súkromia, sú vektor, mestečko` strings
- Vitest `lib/locales-i18n-purity.test.ts` (NEW) — pre každý value v `lib/locales/pl.ts` check že neobsahuje Slovak chars `[ďôťľĺŕäéíóúýÁ]` (full Slovak diacritic set)

---

## 🟡 MAJOR · 7 issues (G-09 + G-10 removed/merged)

### G-06 · `/dla-szkol` chýba kontaktný formulár

**File:** `app/dla-szkol/page.tsx`

**Akcia:** pridať `<ContactForm variant="schools">` blok pred footer + vytvoriť `components/contact-form.tsx` primitive.

```tsx
// components/contact-form.tsx (NEW)
"use client";
import { useState } from "react";

export function ContactForm({ variant }: { variant: "general" | "schools" | "press" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic: variant, message: `${school}\n\n${message}` }),
      });
      if (res.ok) setSent(true);
    } finally { setBusy(false); }
  }

  if (sent) return <div className="card p-6 text-center"><span className="text-3xl">✅</span><p>Děkujeme! Ozveme se do 2 pracovních dnů.</p></div>;
  return (
    <form onSubmit={submit} className="card p-6 flex flex-col gap-3">
      {/* fields: name, email, school name, message */}
    </form>
  );
}
```

`/api/contact` route share-uje sa s G-02 (FAQ + Kontakt page).

**Quality gate:** `/dla-szkol` má visible kontaktný formulár, NIE "Kontakt — wkrótce".

---

### G-07 · `/games/ai` parent route 404

**Aktuálne:** `app/games/ai/[id]/page.tsx` existuje ale `app/games/ai/page.tsx` chýba → 404.

**Vytvoriť `app/games/ai/page.tsx`** (NEW):
```tsx
import Link from "next/link";
import { listActiveAiGames } from "@/lib/ai-pipeline/publish";
import { getLang } from "@/lib/i18n-server";
import { dictFor } from "@/lib/i18n";
import { LiveCountdown } from "@/components/live-countdown";

export const dynamic = "force-dynamic";

export default async function AiGamesHub() {
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.aiHub;
  const active = await listActiveAiGames();

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="t-h2">{t.title}</h1>
        <p className="text-[var(--ink-muted)]">{t.body}</p>
      </header>

      {active.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[var(--ink-muted)]">{t.emptyBody}</p>
          <p className="text-xs mt-2">{t.rotationHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {active.map((envelope) => (
            <Link
              key={envelope.id}
              href={`/games/ai/${envelope.id}`}
              className="card card--interactive p-5 flex flex-col gap-2"
            >
              <span className="text-3xl">{envelope.glyph ?? "🤖"}</span>
              <h3 className="font-semibold" lang="pl">{envelope.title}</h3>
              <span className="t-caption text-[var(--ink-muted)]">
                <LiveCountdown validUntil={envelope.validUntil} color="var(--ink-muted)" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

Pridať `dict.aiHub` × 4 jazyky so keys `title, body, emptyBody, rotationHint`.

**Quality gate:** `/games/ai` → 200 OK, list 0-3 active envelopes.

---

### G-08 · Per-game pages chýba hero info

**Per-game pages existujú** (10 files verified):
- `app/games/finance-quiz/page.tsx`
- `app/games/word-scramble/page.tsx`
- `app/games/math-sprint/page.tsx`
- `app/games/budget-balance/page.tsx`
- `app/games/currency-rush/page.tsx`
- `app/games/memory-match/page.tsx`
- `app/games/stock-tap/page.tsx`
- `app/games/energy-dash/page.tsx`
- `app/games/power-flip/page.tsx`
- `app/games/ai/[id]/page.tsx`

**Refactor scope:** vytvoriť `<GameHero>` primitive a vložiť ho do každej z 9 evergreen pages. AI variant koordinuje s PR-M (AI engagement scope ktorý už zahŕňa Watt chip + progress).

**Vytvoriť `components/game-hero.tsx`** (NEW):
```tsx
import type { GameMeta } from "@/lib/games";
import type { Lang } from "@/lib/i18n";

export function GameHero({ game, lang }: { game: GameMeta; lang: Lang }) {
  return (
    <header className="card p-6 flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl">{game.emoji}</span>
        <h1 className="t-h2">{game.title}</h1>
      </div>
      <p className="text-[var(--ink-muted)]">{game.description}</p>
      <div className="flex flex-wrap gap-2">
        <span className="chip">⏱ {game.durationLabel}</span>
        <span className="chip">⚡ Až {game.xpCap} W</span>
        {game.ageHint && <span className="chip">{game.ageHint}</span>}
      </div>
    </header>
  );
}
```

**Per-page integration** (každá z 9 evergreen pages):
```tsx
// app/games/finance-quiz/page.tsx (príklad)
import { GameHero } from "@/components/game-hero";
import { getGame } from "@/lib/games";
import { getLang } from "@/lib/i18n-server";
import { FinanceQuizClient } from "@/components/games/finance-quiz-client";

export default async function FinanceQuizPage() {
  const lang = await getLang();
  const game = getGame("finance-quiz");
  if (!game) return notFound();
  return (
    <main className="flex flex-col gap-6">
      <GameHero game={game} lang={lang} />
      <FinanceQuizClient />
    </main>
  );
}
```

Replicate × 9 pages. Existing client komponenty (`FinanceQuizClient` atď.) nemení.

**`game.title` per-Lang status:** Sprint E E-03 už refaktoroval na `Record<Lang, string>` (per merge-report). Verify cez:
```bash
grep -A 3 "title:" lib/games.ts | head -15
```
Ak `title: "Energetyczny sprint"` (single string) → E-03 nešiel do PR-L. Treba follow-up.

**Quality gate:**
- Walkthrough screenshots `06-games-finance-quiz.png` (anonymous demo) — viditeľný hero block s emoji + title + description + 3 chips
- Vitest `components/game-hero.test.tsx` — render with mock game, all 4 lang variants

---

### G-11 · 6 production-leak TODOs

**Specific lokácie:**

| File:Line | TODO Content | Severity | Action |
|-----------|--------------|----------|--------|
| `lib/web3/client.ts:37` | `// TODO real impl: subgraph / Alchemy NFT API call by owner.` | MEDIUM | Confirm `NEXT_PUBLIC_WEB3_ENABLED=false` na Vercel; ak true → real impl alebo skry medal CTA |
| `lib/web3/client.ts:54` | `// TODO real impl: POST to our /api/web3/mint with CSRF;` | MEDIUM | Same — confirm flag, then real impl alebo skry mint CTA |
| `app/class/[code]/page.tsx:39` | `exportHint: "Eksport raportu ucznia — MVP skopiuj jako JSON, PDF wkrótce."` | LOW | Implementovať PDF export cez `@react-pdf/renderer` (existing dep), alebo zmeniť copy na "Eksport JSON" (drop "PDF wkrótce") |
| `components/teacher-onboarding-tour.tsx:7` | `(client-side localStorage fallback). API TBD` | MEDIUM | Server-side persistence cez `/api/me/profile` (rovnako ako kid tour z PR-J) |
| `lib/class-roster.ts:40` | `// TODO: wire getUserStats for completeness (V5)` | LOW | Defer to V5 — confirm v PR-O že ostáva ako known limitation |
| `lib/loans.ts:139` | `// TODO Phase 2: incorporate fees once we introduce origination/processing.` | LOW | Defer — fees not part of Phase 1 |

**Quality gate:**
- Audit grep po fix-och: `grep -rnE "(TODO|wkrótce.*PDF)" components app lib | grep -v test | wc -l` → menej TODOs than baseline (5 odstránených alebo dokumentovaných)

---

### G-14 · `/nauczyciel` teacher signup bez email verification

**File:** `app/api/nauczyciel/signup/route.ts:21-24`

**Aktuálny Zod schema:**
```ts
const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120),
  email: z.string().email().max(200).optional().or(z.literal("")),  // OPTIONAL!
  schoolName: z.string().min(1).max(200),
});
```

**Problém:** email je optional → teacher môže registrovať bez email → žiadny verification flow → ktokoľvek môže byť "teacher" + získať kid contacts cez parent-invite.

**Patch 1 — make email required:**
```ts
// app/api/nauczyciel/signup/route.ts:21-24
const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120),
  email: z.string().email().max(200),   // REMOVED .optional().or(z.literal(""))
  schoolName: z.string().min(1).max(200),
});
```

**Patch 2 — add verification flow:**
```ts
// po `createTeacher` v route.ts pridať
import { openTeacherVerification } from "@/lib/teacher-verify";

const { token } = await openTeacherVerification(username, email);
// Send email with /verify?token=xxx link via lib/mailer.ts
await sendTeacherVerifyEmail(email, displayName, token);

// Set teacher account v "pending" state — class creation blocked do verify
```

**Patch 3 — vytvoriť `lib/teacher-verify.ts`** (NEW):
```ts
import { kvSet, kvGet } from "@/lib/redis";
import { randomToken } from "@/lib/crypto";

export async function openTeacherVerification(username: string, email: string) {
  const token = await randomToken(24);
  await kvSet(`teacher:verify:${token}`, JSON.stringify({ username, email, createdAt: Date.now() }), 60 * 60 * 24); // 24h TTL
  return { token };
}

export async function consumeTeacherVerification(token: string) {
  const raw = await kvGet<string>(`teacher:verify:${token}`);
  if (!raw) return null;
  await kvSet(`teacher:verify:${token}`, "", 1); // delete
  return JSON.parse(raw) as { username: string; email: string; createdAt: number };
}
```

**Patch 4 — vytvoriť `app/verify/page.tsx`** (NEW):
```tsx
import { redirect } from "next/navigation";
import { consumeTeacherVerification } from "@/lib/teacher-verify";
import { markTeacherVerified } from "@/lib/class";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const sp = await searchParams;
  if (!sp.token) redirect("/login");
  const data = await consumeTeacherVerification(sp.token);
  if (!data) {
    return <main>Token vypršal alebo je neplatný. Požiadaj o nový verification email.</main>;
  }
  await markTeacherVerified(data.username);
  redirect("/nauczyciel");
}
```

**Patch 5 — block class creation pre unverified teachers:**
V `app/api/class/route.ts` (POST handler) pridať guard:
```ts
const teacher = await getTeacher(session.username);
if (!teacher.verified) {
  return Response.json({ ok: false, error: "teacher-not-verified" }, { status: 403 });
}
```

**Quality gate:**
- Manual smoke: signup → email arrives → klik verify link → redirect /nauczyciel + môžem vytvoriť class
- Manual smoke: pred verify → POST /api/class → 403 "teacher-not-verified"
- Vitest test pre `consumeTeacherVerification` — 24h expiry, single-use

---

## 🔵 MINOR / POLISH · 8 issues (G-09, G-12, G-13 removed)

### G-15 · `/games/finance-quiz` má "Pytanie 1/5" progress ✅
**Validation pre PR-M.** Žiadny ticket — confirms že evergreen games majú progress, AI games po PR-M tiež budú.

### G-16 · `/o-platforme` Lvl9 → Lvl10 numbering check
**File:** `lib/city-level.ts:174-175`. Verify že `LEVEL_UNLOCKS` keys 1-10 sú konzistentné s `eduMoment` ladder labels. Potential off-by-one v `app/o-platforme` rendering.

### G-17 · `/o-platforme` PKO over-branding
PKO mention ukazuje 3+ times (heading section, sponsorship list, footer thanks). Reduce na 2 (1 hero badge + 1 footer thanks) per design discipline.

### G-18 · Web3 flag confirm
Verify production env `NEXT_PUBLIC_WEB3_ENABLED`. Ak `false` → G-11 web3 stubs nie sú visible. Ak `true` → real impl required.

### G-22 · CSRF na `/api/lang`
**Low impact** — lang switch nie je destructive. Optional: pridať `Origin` header check pre strict GDPR/security:
```ts
// app/api/lang/route.ts
const origin = req.headers.get("origin");
if (origin && new URL(origin).host !== new URL(req.url).host) {
  return Response.json({ ok: false, error: "cross-origin" }, { status: 403 });
}
```

### G-23 · useEffect cleanup spot-check
Audit 5 effects ktoré som overil v Pass-9 inspect:
- `notification-bell.tsx:46-57` ✅ má `clearTimeout + clearInterval`
- `friends-client.tsx:51-54` — verify `clearTimeout(id)` v cleanup
- `game-comments.tsx:31-34` — verify cleanup
- `parent-invite-card.tsx:118-126` — `setInterval(compute, 60_000)` musí mať `clearInterval`
- `tier-up-toast.tsx:33-47` — `setTimeout(poll, 20_000)` musí mať clear

Bash audit:
```bash
grep -A 6 "useEffect" components/*.tsx | grep -B 6 "setInterval\|setTimeout" | grep -B 8 "return"
```
Expect každý interval/timer má cleanup. Flag findings.

### G-24 · F-01 `/loans/compare` reference cleanup audit
Po PR-N merge audit referenced files:
```bash
grep -rnE "(/loans/compare|loans-compare)" components app lib | grep -v test | grep -v "_fe-fix"
```
Expected post-PR-N:
- `app/loans/compare/page.tsx` → still exists ako redirect (ok)
- `components/onboarding-tour.tsx:41,48,54,60` → updated na `/miasto#hypoteka`
- `components/site-footer.tsx:141` "Porovnaj půjčky" link → ak ostáva ako redirect-thru-href, OK; ak F-01 spec ho odstránil, zaznamenať
- `components/site-nav.tsx:90,99` → odstránený (PR-N deletes "Půjčky" navlink)
- Ostatné komentáre — nie blocker, ale clean-up nice-to-have

### G-26 · `app/parent/[username]/page.tsx:25` generic notFound() pre non-parent
```tsx
// BEFORE
if (!(await isParentOf(session.username, username))) notFound();

// AFTER
if (!(await isParentOf(session.username, username))) {
  return (
    <main className="max-w-xl mx-auto py-12 text-center">
      <span className="text-5xl">🚫</span>
      <h1 className="t-h2">Nemáš oprávnenie pozerať tento profil</h1>
      <p>Ak si rodič, požiadaj o invite cez <Link href="/rodzic">/rodzic</Link>.</p>
    </main>
  );
}
```
Per-Lang strings + http status header (consider 403).

---

## 1 · Acceptance gate (PR-O)

```bash
pnpm typecheck && pnpm lint && pnpm test
WALKTHROUGH_LABEL=post-pr-o pnpm test:walk
pnpm test:walk:diff
pnpm test:e2e ux-fixes && pnpm test:e2e i18n-consistency.spec.ts
pnpm test:e2e register-validation.spec.ts  # NEW per G-01
```

Manual smoke checklist (live dev):
1. `/register` → birth year má 11 entries (2010-2020 ak today=2026), žiadny 1932/2021. Password rules visible. 
2. `/games/foo` → custom 404 (nie generic Vercel)
3. `/consent` → informational page so 3 cookies listing
4. `/o-platforme` (PL session) → žiadne Slovak strings ("Vďaka", "Späť", "žiadne PNG", "súkromia")
5. `/dla-szkol` → kontaktný formulár visible
6. Hraj /games/budget-balance → vidno hero block s rules + duration + Watts reward
7. Footer (na každej page) — žiadne "wkrótce / brzy / coming soon" (alebo skryté podľa PO decision G-02)
8. `/games/ai` → 200 OK, list 0-3 active envelopes (NIE 404)
9. `/nauczyciel/signup` → email required, post-signup verify email arrives, kým nie je verified → POST /api/class → 403

---

## 2 · Order of operations (PR-O, ~6 commitov)

1. **G-03 error boundaries** — 4 NEW files, foundation
2. **G-05 hardcoded i18n strings** — `app/o-platforme` (7 strings) + auth-form (4 strings) + register chip (1 string)
3. **G-12/G-13 removed false positives** — len audit confirm (žiadny commit needed)
4. **G-04 /consent page** — NEW route (informational only)
5. **G-01 register validation** — 7 patches (auth-form + register/route + locales)
6. **G-08 GameHero primitive** — `<GameHero>` integrace × 9 evergreen pages
7. **G-07 /games/ai hub** — NEW route
8. **G-06 /dla-szkol contact form** + G-02 FAQ + Kontakt (depends on PO decision)
9. **G-14 teacher email verification** — schema change + verify route + mailer

---

## 3 · 6 PO decisions ktoré sú v spec

1. **G-02 FAQ + Kontakt** — A (implement, ~6h FE) alebo B (hide placeholders, 15 min)?
2. **G-08 game.rules data shape** — `lib/games.ts` extension treba per-game `rules` array. LLM-assisted draft + native review?
3. **G-14 teacher verification** — minimum scope (verify email link 24h TTL) alebo full admin approval queue (post-Pass-10)?
4. **G-18 Web3 enabled** — production state `NEXT_PUBLIC_WEB3_ENABLED`?
5. **G-22 CSRF na /api/lang** — strict (Origin check) alebo accept lower-bar?
6. **G-24 footer compare loans link** — odstrániť po F-01 redirect alebo nechať?

---

## 4 · Edge cases / known unknowns

- **G-01 birth year clamp + existing accounts** — DB možno obsahuje accounts so birthYear < 2010 (legacy seed). Migration: don't auto-deactivate, len blokuje **nové** registrácie cez clamp.
- **G-03 segment vs root not-found precedence** — Next.js 16: app/games/[id]/not-found.tsx má priority pred app/not-found.tsx ✅. Test cez audit `notFound()` calls.
- **G-04 /consent SSR vs CSR** — server component (clean per-Lang). Cookie banner (`components/cookie-consent.tsx`) ostáva client component pre user interaction.
- **G-05 audit grep risk** — Polish chars ⊂ Slovak chars set, takže blanket "no Slovak chars" check by false-positive triggol PL diacritics. Pre purity test treba **Slovak-specific chars**: `ô, ť, ľ, ĺ, ŕ, ä` (chars NOT in PL alphabet).
- **G-07 active envelopes 0** — empty state musí byť graceful (rotation hint, alebo CTA na evergreen games).
- **G-08 GameHero per-Lang `description`** — verify že `lib/games.ts:24-26` má description per-Lang po Sprint E E-03 refactor.
- **G-14 mailer config** — `lib/mailer.ts` musí byť deployed s SMTP credentials. Ak nie sú, fallback na log-only (development) + flag pre PO.

---

## 5 · Reporting back

Po dokončení PR-O napíš merge-report:
- Per-commit summary + diff sizes
- Quality gates (typecheck/lint/vitest/playwright pass counts)
- Walkthrough delta — top 3 vizuálne / UX zmeny
- Security audit summary — register validation enforced, teacher verify gate live, consent page informational
- Regulatory checklist — GDPR-K compliance: birth year clamped (7-16), parent email flow ✅, consent informational page ✅
- Per-route 404 audit — manual list všetkých routes + custom not-found behavior
- Footer cleanup — pred (FAQ wkrótce / Kontakt wkrótce) ↔ po (linky na /faq, /kontakt alebo skryté)
- Open follow-ups — Pass-11 candidates (G-23 useEffect cleanup audit, G-08 game rules native review, G-14 admin approval queue)
