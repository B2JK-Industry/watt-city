# Sprint G — security, regulatory, error boundaries, anonymous flow polish (Pass-10)

**Vstup:** product-visionar parallel deep QA počas FE shipnutia Sprint F (PR-N). 26 nálezov mimo PR-N scope cez 14 routes (public + auth-required) + code audit (security, error handling, brand violations, a11y, timer leaks).
**Cieľ:** opraviť 5 CRITICAL (regulatory + security + missing error boundaries), 9 MAJOR (UX + content gaps), 12 MINOR/POLISH (placeholders, copy, audit cleanup).
**Reviewer:** product visionar. Schválim PR-O keď: walkthrough 0 axe-core findings, security audit potvrdí žiadne secret leaks ani rate-limit gaps, /register dovolí len 9-14 ročné registrácie, error boundaries pokrývajú všetky route segmenty.

> **Branding pravidlá** (AGENTS.md): no `border-2+`, no hard-offset shadows, no `uppercase` (mimo `.t-overline`), no `font-extrabold`, no arbitrary `rounded-[Npx]`, no nové hex mimo design tokens.

---

## 0 · Pre-flight

```bash
git status                                  # clean (post Sprint F PR-N merge)
git log --oneline -5                        # potvrď že PR-N je shipped
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test    # baseline
WALKTHROUGH_LABEL=pre-pr-o pnpm test:walk   # baseline 56 routes
```

**KOORDINÁCIA s PR-N:** Niektoré nálezy (G-04, G-15) prekrývajú sa so Sprint F F-02 (CityScene solid colors). Predpokladám že PR-N je **už merged** pred štartom PR-O. Ak nie — flag konflikt v PR review.

---

## 🔴 CRITICAL · 5 issues

### G-01 · `/register` birth year dropdown 1930-2021 (regulatory + security + UX trifecta)

**Čo užívateľ vidí:** registračný formulár dovolí birth year **1930-2021** → najmladší user 5 rokov, najstarší 96 rokov. **Cieľová skupina je 9-14 rokov** (= birth years 2012-2017). Plus žiadne password rules, single consent (no separate GDPR/terms).

**Dopady:**
- **Regulatory:** EU GDPR-K (under-13) vyžaduje **parental consent flow**. Aktuálne nie je implementovaný — 8-roč dieťa môže registrovať bez parent verification.
- **Security:** žiadne password strength rules → 8-mesačné deti môžu nastaviť `"password"` ako heslo
- **UX:** "GDPR-K" label bez vysvetlenia — deti to nedekódujú

**Súbory:**
- `app/register/page.tsx` (form fields)
- `app/api/auth/register/route.ts` (BE validation — pridať birth-year guard)
- `lib/locales/{pl,uk,cs,en}.ts` (consent copy refresh)

**Fix:**
1. **Birth year dropdown 2010-2017** (8-15 vekový buffer pre cieľovku 9-14)
2. **Password rules** — min 8 znakov, aspoň 1 číslica + 1 písmeno (display ako live checklist počas typing)
3. **Pre under-13** (birth year 2014+) → dodatočný **parent email** field + email-verification flow (cookie pending status do parent-confirms)
4. **2 separated consents:**
   - GDPR data processing (required)
   - Terms of service (required)
   - Marketing emails (optional, default off)
5. **GDPR-K explainer** — pri form pridať drobnú card "Pre deti pod 13 rokov potrebujeme súhlas rodiča. Po registrácii pošleme email rodičovi/zákonnému zástupcovi."

**Quality gate:**
- `app/api/auth/register/route.ts` returns 400 ak `birthYear < 2010 || birthYear > 2017`
- Vitest `register-validation.test.ts` overuje birth-year clamp + password strength
- Manual smoke: pokus registrovať s birthYear=2008 → reject

---

### G-02 · Site footer "FAQ wkrótce / Kontakt wkrótce" na všetkých stránkach

**Čo užívateľ vidí:** footer (visible na **každej** public stránke) má dva placeholder linky:
- "FAQ — wkrótce" / "FAQ — brzy" / atď.
- "Kontakt — wkrótce" / "Kontakt — brzy"

**Súbor:** `components/site-footer.tsx:41-42, 51-52` (per-Lang COPY)

**Dopady:** Pre PKO partnership demo signál "incomplete product". Pre koncového usera frustrácia (nemá kde dať feedback / pýtať otázku).

**Fix — 2 možnosti:**

**A) Implementovať obe (preferované, ale väčší scope):**
- `app/faq/page.tsx` — minimálna FAQ page so 6-10 najbežnejšími otázkami (per-Lang)
- `app/kontakt/page.tsx` — kontaktný formulár s name + email + message + topic selector → POST `/api/contact` → email/Slack notification

**B) Hide placeholder linky kým nie sú hotové:**
- Odstrániť `faq` + `contact` keys z `COPY` v site-footer.tsx
- Pridať TODO komentár pre buduce reactivation

**Odporúčanie:** **A pre Pass-10**, keďže pre PKO demo treba production-grade footer. Ak time-box tlačí, B s explicit TODO.

**Quality gate:**
- Walkthrough všetkých 14 routes — žiadne "wkrótce / brzy / coming soon" v footer
- (A) Manual smoke: kontakt form → email arrives na test@local

---

### G-03 · Žiadne error boundaries mimo `/miasto`

**Čo užívateľ vidí:** runtime exception kdekoľvek mimo `/miasto` → **Brave/Chromium browser-level error page** (čierna obrazovka s "This page couldn't load"), žiadna graceful UI.

**Existujúce:** `app/miasto/error.tsx` (z PR-K R-07)
**Chýbajúce:**
- `app/error.tsx` — root segment fallback
- `app/global-error.tsx` — root layout error (Pass-7 spec to popisoval ale nie je shipped)
- `app/not-found.tsx` — custom 404 (namiesto generic Vercel default)
- `app/loading.tsx` — loading skeleton pre slow server renders
- `app/games/[id]/not-found.tsx` — invalid game ID 404
- `app/games/ai/[id]/not-found.tsx` — invalid AI envelope ID 404

**Fix:**

**1. Vytvoriť `app/error.tsx`** (root segment-level):
```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[root] runtime error:", error); }, [error]);
  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl" aria-hidden>⚠️</span>
      <h1 className="t-h2">Něco se pokazilo</h1>
      <p className="text-[var(--ink-muted)]">Nepodařilo se načíst stránku. Zkusíme to znovu.</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-primary">Zkusit znovu</button>
        <Link href="/" className="btn btn-secondary">Zpět na úvod</Link>
      </div>
      {error.digest && <p className="text-xs text-[var(--ink-muted)] font-mono">{error.digest}</p>}
    </main>
  );
}
```

**2. Vytvoriť `app/global-error.tsx`** (catastrophic fallback) — copy z _fe-fix-prompt-pass7.md R-07-A.

**3. Vytvoriť `app/not-found.tsx`** (custom 404):
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

**4. Vytvoriť `app/games/[id]/not-found.tsx`** + `app/games/ai/[id]/not-found.tsx` (špecificky pre invalid game IDs)

**5. Per-Lang copy** — všetky strings vyniest do `lib/locales/*` keys.

**Quality gate:**
- Manual smoke: `/games/foo` → custom 404 (nie generic Vercel)
- Manual smoke: `/games/ai/invalid` → custom 404
- `app/error.test.tsx` — render error.tsx s mock error, klik retry calls reset()
- Throw mock error v `/games` page → `app/error.tsx` zobrazí, žiadny browser-level page

---

### G-04 · `/consent` 404 — cookie consent stránka neexistuje

**Čo užívateľ vidí:** `components/cookie-consent.tsx` predpokladá že je tam GDPR consent flow, ale `/consent` route **neexistuje** (404). User dá initial consent v banner, ale nemá kde **manage** ho neskôr.

**Pre EU GDPR je toto regulatory hole** — user má právo withdrawnúť consent kedykoľvek.

**Súbory:**
- Vytvoriť `app/consent/page.tsx` (consent management page)
- `components/cookie-consent.tsx` (link z banner footer "Manage preferences" → /consent)

**Fix:**
1. Vytvoriť `app/consent/page.tsx` — server component, zobrazí:
   - Aktuálny consent status (z cookie/localStorage)
   - 3 toggles: necessary (always on, disabled), analytics, marketing
   - "Save preferences" button → POST /api/consent
   - Link na privacy policy `/ochrana-sukromia`

2. Vytvoriť `app/api/consent/route.ts` (POST update, GET current state)

3. V `cookie-consent.tsx` banner pridať footer link:
```tsx
<Link href="/consent" className="text-xs underline">
  {t.managePreferences}
</Link>
```

**Quality gate:**
- Manual smoke: `/consent` loaduje, toggle preferences, save → cookie state updated
- Banner footer ukazuje "Spravovať preferencie →"

---

### G-05 · `/o-platforme` jazykový mix — Slovak/Czech leak v PL session

**Čo užívateľ vidí** (po prepnutí na PL): mid-content sa objavujú strings ako:
- "Vďaka" (Slovak — má byť "Dziękujemy")
- "Späť na domov" (Slovak)
- "Úplné typové pokrytie" (Czech)
- "žiadne PNG/JPG" (Slovak — má byť "żadnych PNG/JPG")

**Hypotéza:** developer napísal placeholder strings v Slovak/Czech a zabudol preložiť do PL. Audit:
```bash
grep -nE "(Vďaka|Späť|Úplné typové|žiadne PNG|tiež zahrn|premysli)" lib/locales/pl.ts | head
```

**Súbor:** `lib/locales/pl.ts` (audit + fix každý leak)

**Fix:** Replace každý SK/CS leak s PL equivalent. Treba review native PL speaker (ideálne PKO partnership team) alebo aspoň competent translator.

**Quality gate:**
- `pnpm test` — vitest test ktorý prejde každý value v `lib/locales/pl.ts` cez **PL-specific char set check** (žiadne `ě`, `ť`, `ô` Slovak chars)
- Manual review native PL speaker

---

## 🟡 MAJOR · 9 issues

### G-06 · `/dla-szkol` chýba kontaktný formulár (B2B conversion killer)

`/dla-szkol` (B2B audience: učitelia, riaditelia) má len "Kontakt — wkrótce". Pre B2B sales je toto **conversion killer**. Treba:
- Inline kontaktný formulár (name, school, email, message, role)
- POST `/api/contact?source=schools` → email/Slack notification
- Po submit: confirmation card "Děkujeme, ozveme se do 2 pracovních dnů"

**Súbor:** `app/dla-szkol/page.tsx` (pridať `<ContactForm variant="schools">` blok)

---

### G-07 · `/games/ai` parent route 404

Hub pre AI games neexistuje. User dôjde k `/games/ai/<id>` cez CityScene LIVE building click, ale parent route je dead-end.

**Fix:** vytvoriť `app/games/ai/page.tsx` so:
- Heading "Aktuálne AI výzvy"
- Listing 3 active envelopes (z `listActiveAiGames()`)
- Per-envelope card s timer + "Hrať teraz" CTA
- Fallback empty state ak žiadne aktívne (link na rotation schedule)

---

### G-08 · `/games/<id>` per-game pages chýba kľúčové info (audit 9 evergreen + 3 AI)

WebFetch /games/stock-tap + /games/budget-balance: **žiadny game-specific hero**, žiadne pravidlá, žiadny estimated duration, žiadny Watts reward, žiadny leaderboard preview.

**Súbory:**
- `app/games/[id]/page.tsx` (server component pre evergreen games)
- `app/games/ai/[id]/page.tsx` (AI variant — Sprint PR-M už possibly addressuje per posledné správy)

**Fix:** každá per-game page musí mať hero block:
```tsx
<header className="card p-6 flex flex-col gap-3">
  <h1>{g.title[lang]} {g.emoji}</h1>
  <p className="text-[var(--ink-muted)]">{g.description[lang]}</p>
  <div className="flex flex-wrap gap-2">
    <span className="chip">⏱ ~{g.estimatedSeconds}s</span>
    <span className="chip">⚡ Až {g.maxWatts} W</span>
    <span className="chip">{g.difficulty[lang]}</span>
  </div>
  <ol className="text-sm list-decimal pl-5">
    {g.rules[lang].map((r, i) => <li key={i}>{r}</li>)}
  </ol>
</header>
```

Vyžaduje refactor `lib/games.ts` GameMeta type (pridať `description`, `estimatedSeconds`, `maxWatts`, `difficulty`, `rules`). Per-Lang.

**Coordinated with PR-M (AI engagement scope):** ak PR-M už pridal Watt chip + progress pre AI games, koordinuj rovnaký komponent (`<GameHero>`) pre evergreen aj AI cesty.

---

### G-09 · `/marketplace` ("Giełda") obsah nejasný

Site-nav obsahuje "Giełda" → /marketplace. WebFetch nedostal user-readable obsah (možno auth required + redirect na /login). Treba audit:
- Či existuje meaningful content alebo stub
- Či je gated cez "Tier 7+" (per /o-platforme zmienka "miejska giełda budynków po Tier 7")
- Ak gated, pri visite by mal byť **clear "lock" state s tier requirement**, nie blank page

**Súbor:** `app/marketplace/page.tsx`

---

### G-10 · `app/games/foo` (invalid ID) — generic Vercel 404, nie custom

Confirmed cez WebFetch — invalid game ID returnuje 404 ale bez custom UI. Po G-03 fix (`app/not-found.tsx` + `app/games/[id]/not-found.tsx`) bude pokryté. **Verify že segment-specific not-found má precedence pred root.**

---

### G-11 · Production-leak TODO/FIXME comments v kóde

Audit grep zachytil 6 production TODOs:
- `lib/web3/client.ts:37, 54` — Web3 stubs (`getNftsByOwner`, `mintCertificate` fake impl). Ak `NEXT_PUBLIC_WEB3_ENABLED=true` na Vercel, klikanie na medal mint zlyhá silently.
- `app/class/[code]/page.tsx:39` — "PDF wkrótce" leak v teacher classroom export
- `components/teacher-onboarding-tour.tsx:7` — "API TBD; client-side localStorage fallback" — teacher signup flow má incomplete BE persistence (refresh → tour reappears)
- `lib/class-roster.ts:40` — TODO V5 wire stats — class progress incomplete
- `lib/loans.ts:139` — TODO Phase 2 fees — RRSO compute bez fees pre niektoré produkty
- `app/miasto/page.tsx:20` — TODO promote dict to lib/locales — DICT inline v page (refactor scope, low priority)

**Fix:**
- Web3 stubs → buď replace s real impl (subgraph + Alchemy NFT API + actual mint POST), alebo `NEXT_PUBLIC_WEB3_ENABLED=false` na Vercel deploy + skry medal CTA
- Teacher classroom PDF → buď implementovať PDF export cez `@react-pdf/renderer` (existing dep!), alebo skry PDF button kým nie je hotový
- Teacher onboarding tour → server-side persistence cez `/api/me/profile` (rovnako ako kid tour z PR-J)

---

### G-12 · `cashflow-hud.tsx:131-132` JSON.parse bez try-catch

```ts
const raw = window.localStorage.getItem(HUD_DISMISS_KEY);
return raw ? (JSON.parse(raw) as HudDismiss) : null;
```

Ak v localStorage je corrupted JSON (DevTools edit, browser sync conflict, app version migration), `JSON.parse` vyhodí synchronne **uncaught SyntaxError** → component crash → po G-03 fix CASH-FLOW-HUD ukazuje error boundary, ALE side effect: cashflow informácia zmizne pre celú session.

**Fix:**
```ts
function readDismiss(): HudDismiss | null {
  try {
    const raw = window.localStorage.getItem(HUD_DISMISS_KEY);
    return raw ? (JSON.parse(raw) as HudDismiss) : null;
  } catch (e) {
    console.warn("[cashflow-hud] corrupted dismiss state, resetting:", e);
    window.localStorage.removeItem(HUD_DISMISS_KEY);
    return null;
  }
}
```

Audit aj `components/onboarding-tour.tsx:91`, `components/pwa-register.tsx:36`, `components/cookie-consent.tsx:45` — všetky `localStorage.getItem` bez try-catch (string-only return je OK, ale ak JSON.parse pridaný neskôr, treba guard).

---

### G-13 · Division by zero v progress/percentage compute

```bash
grep -rnE "Math\.(floor|ceil|round)\(.+\/" components lib | head
```

Suspect lokácie:
- `components/curriculum-chart.tsx:36` — `Math.round((c.covered / c.total) * 100)` → ak `total === 0` → **NaN** → React error "received NaN for the children attribute" + broken render
- `components/live-countdown.tsx:41/54/55` — countdown math, ak `msLeft < 0` → negative seconds (cosmetic) ale ak countdown is `validUntil = 0`, `Date.now() / 1000` returns ~ huge number → "12345678h"

**Fix per-occurrence:**
```ts
// curriculum-chart.tsx:36
const pct = c.total > 0 ? Math.round((c.covered / c.total) * 100) : 0;
```

Audit grep + fix. Vitest test pre každú compute func: `divideZero` case → returns 0, nie NaN.

---

### G-14 · `/nauczyciel` teacher signup bez verification — security/privacy hole

`/nauczyciel/signup` (verified anonymous WebFetch) ukazuje **plný registration form** bez:
- Email verification (treba odoslať code na inbox, kým ho user nepotvrdí)
- School domain check (mohol by validovať že email má `.edu.pl` alebo školský domain)
- Manual approval queue (admin must verify teacher status pred granting permissions)

**Dopady:** ktokoľvek môže registrovať ako "teacher" → vidí kid data, generuje class codes, posiela parent invite emails. **Pre EU child product je toto regulatory + privacy hole.**

**Fix (minimum scope pre Pass-10):**
1. Email verification po signup → user dostane email s `/verify?token=xxx` link
2. Pred verification: account v `pending` state, nemôže vytvoriť class
3. After verify: standard teacher permissions
4. Optional Pass-11: manual admin approval queue

**Súbory:**
- `app/api/auth/teacher-register/route.ts` (BE flow update)
- `lib/mailer.ts` (verification email template)
- `app/verify/page.tsx` (NEW — token landing)

---

## 🔵 MINOR / POLISH · 12 issues

### G-15 · `/games/finance-quiz` má "Pytanie 1/5" progress ✅
**Už hotové pre evergreen games.** Validates Sprint PR-M scope (P1 progress chip pre AI games). Po PR-M shipnutí budú aj AI games konzistentné. Žiadny ticket — len note.

### G-16 · `/o-platforme` Lvl9 → Lvl10 off-by-one numbering
Lvl10 "Endgame" labeled ako tier po Lvl9. Verify v `lib/city-level.ts:175` "Poziom 10 = wzór" — možno duplicate label.

### G-17 · `/o-platforme` PKO mention 3+ times
Over-branding signal — sponsor mentions sa opakujú v multiple sections. Reduce na 1 hero + 1 footer = 2 max.

### G-18 · `lib/web3/client.ts` stubs — confirm `NEXT_PUBLIC_WEB3_ENABLED` flag

Verify že `NEXT_PUBLIC_WEB3_ENABLED=false` na Vercel production. Ak `true`, medal gallery klikne → silent fail. Plus už-shipnuté `medal-gallery-section.tsx:3` má guard ✅.

### G-19 · `notification-bell.tsx` setInterval(45_000ms) cleanup ✅
**Confirmed clean** (Read riadky 51-57). Žiadny ticket.

### G-20 · `dangerouslySetInnerHTML` v `pko-mascot.tsx:44` ✅
**Confirmed safe** — `mascot.svg` je z `lib/theme.ts` (hardcoded). Override cez `NEXT_PUBLIC_PKO_MASCOT_URL` env var (deployer-controlled). Žiadny XSS risk z user input.

### G-21 · API routes bez session check ✅
**Confirmed safe** — `/api/admin/*` majú `requireAdmin` (lib/admin.ts: session role=admin OR ADMIN_SECRET header). `/api/leaderboard` je intentionally public read. `/api/lang` je intentionally session-less (cookie set + revalidate). Žiadny ticket.

### G-22 · Webhook CSRF na `/api/lang`
`/api/lang` set cookie bez CSRF token. Realisticky low impact (lang switch nie je destructive), ale ak chcerme strict GDPR/security: pridať `Origin` header check.

### G-23 · 87 useEffects v components/ — spot-check audit
Sample 5 effects: `friends-client.tsx:51, 54`, `game-comments.tsx:31, 34`, `notification-bell.tsx:46, 59`, `parent-invite-card.tsx:118, 124-126`, `tier-up-toast.tsx:33, 47`. Verify že majú return cleanup. Notification-bell ✅. Treba audit ostatných.

### G-24 · F-01 `/loans/compare` deletion impact — full reference cleanup

PR-N F-01 spec hovorí o redirect na `/miasto#hypoteka`, ALE `/loans/compare` je referenced v **13 miestach**:
- `cashflow-hud-mount.tsx:15` (komentár)
- `onboarding-tour.tsx:41, 48, 54, 60` (4 langs CTA href)
- `loan-comparison.tsx:138` (komentár)
- `site-footer.tsx:141` ("Porovnaj půjčky" footer link)
- `watt-city-client.tsx:925, 928` (porovnaj link)
- `site-nav.tsx:90, 99` (PR-J nav link — F-01 odstránenie)
- `layout.tsx:196` (komentár)
- `app/loans/compare/page.tsx:24` (redirect pôvodný)
- `app/api/analytics/web-vitals/route.ts:59` (analytics tracking)

**Po PR-N merge audit:** treba over že FE updatol VŠETKY references. Footer link (G-09 inline ticket) môže byť nedopatrenie.

### G-25 · `lib/ai-pipeline/generate.ts` — PL-only AI titles (already addressed v Pass-8 E-03)

E-03 z Pass-8 spec navrhol `<span lang="pl">` fallback pre AI titles. Verify či PR-L shipnul. Ak nie, znovu open ako follow-up.

### G-26 · `app/parent/[username]/page.tsx:25` — generic notFound() pre non-parent

Ak user nie je parent daného kid, `notFound()` returnuje generic 404. Lepšie: 403 s explainer "Nemáš oprávnenie pozerať profil tohto dieťaťa. Ak si rodič, požiadaj o invite cez /rodzic."

---

## 1 · Acceptance gate (PR-O)

```bash
pnpm typecheck && pnpm lint && pnpm test
WALKTHROUGH_LABEL=post-pr-o pnpm test:walk
pnpm test:walk:diff
pnpm test:e2e ux-fixes && pnpm test:e2e i18n-consistency.spec.ts
pnpm test:e2e register-validation.spec.ts  # NEW per G-01
```

Manual smoke (live dev):
- `/register` — birth year max je 2017 (8 rokov), žiadny 2021. Password rules visible. 2 separated consents.
- `/games/foo` → custom 404 (NIE generic Vercel)
- `/consent` → consent management page so 3 toggles
- `/o-platforme` (PL session) → žiadne Slovak/Czech leak strings ("Vďaka", "Späť")
- `/dla-szkol` → kontaktný formulár visible (nie "Kontakt — wkrótce")
- Hraj /games/budget-balance → vidno hero block s rules + duration + Watts reward
- `/marketplace` → buď meaningful obsah alebo clear "lock" state s tier requirement

---

## 2 · Order of operations (PR-O, ~7 commitov)

1. **G-03 error boundaries** — foundation, blokuje audit ostatných pages
2. **G-12 + G-13** — quick try-catch + division guards (low risk)
3. **G-04 consent page** — vytvoriť /consent + API
4. **G-01 register validation** — birth year + password + GDPR-K parent flow (najväčší scope)
5. **G-08 per-game hero** — refactor lib/games.ts type + 9 evergreen pages + AI page (large)
6. **G-02 footer FAQ + Kontakt** — buď implementovať alebo skry (decision PO)
7. **G-05 PL locale leak audit** — manual fix po PL native review

Po každom commite re-run `pnpm test:walk` + diff.

---

## 3 · Decisions ktoré PO musí potvrdiť pred FE štartom

1. **G-02 FAQ + Kontakt** — implementovať obe (cca 4-6h FE work) alebo hide placeholders (15 min)?
2. **G-08 per-game hero refactor** — `lib/games.ts` GameMeta extension je breaking schema change. Confirmed že vitest tests vychytí každý broken consumer?
3. **G-14 teacher email verification** — minimálny scope (just verification email link) alebo full admin approval queue?
4. **G-18 Web3 enabled flag** — production stav `NEXT_PUBLIC_WEB3_ENABLED`? Ak true → potreba real impl (vyše scope), ak false → skip Web3 work
5. **G-22 CSRF na /api/lang** — strict (Origin check) alebo accept lower-bar?
6. **G-24 footer compare loans link** — odstrániť úplne (po F-01 redirect je redundant), alebo nechať redirect cez nav?

---

## 4 · Edge cases / known unknowns

- **G-01 GDPR-K parent email** — vyžaduje email infrastructure (mailer config, template). Ak chýba, parent flow degraduje na manual contact ("zavolaj rodičovi, nech ti vytvorí účet"). Plánovaný side-effect: trochu friction pre kid signup, ale regulatory must.
- **G-03 segment vs root not-found** — Next.js precedence rules: `app/games/[id]/not-found.tsx` musí mať priority pred `app/not-found.tsx`. Test cez manual route audit.
- **G-08 game.rules data shape** — pre 9 evergreen games × 4 langs = 36 rules sets to write. Možno LLM-assisted draft + native speaker review. Plánovaný side-effect: copy debt.
- **G-14 teacher verification** — môže blokovať existing test accounts. Add migration: existing `teacher` records auto-marked `verified` cez seed.
- **G-25 AI pipeline lang** — long-term solution je multi-lang generation v `lib/ai-pipeline/generate.ts` (Claude prompt asks for PL+UK+CS+EN simultaneously). Pass-10 stačí span lang fallback (E-03 z Pass-8).

---

## 5 · Reporting back

Po dokončení PR-O napíš merge-report:
- **Per-commit summary** + diff sizes
- **Quality gates** (typecheck/lint/vitest/playwright pass counts)
- **Walkthrough delta** — top 3 vizuálne / UX zmeny
- **Security audit summary** — admin auth verified, register validation enforced, consent management live
- **Regulatory checklist** — GDPR-K compliance: birth year clamped ✅, parent email flow ✅, consent management ✅
- **Per-route 404 audit** — manual list všetkých routes + custom not-found behavior
- **Footer cleanup** — pred (FAQ wkrótce / Kontakt wkrótce) ↔ po
- **Open follow-ups** — Pass-11 candidates (G-25 AI multi-lang generation, G-08 game rules native review, G-14 admin approval queue)
