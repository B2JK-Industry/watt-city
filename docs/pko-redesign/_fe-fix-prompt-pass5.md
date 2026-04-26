# Prompt pre FE dev — release N+2 (Sprint C-tail polish + finálna acceptance)

> Skopíruj celý tento súbor ako úvodný prompt pre nový dev session. Agent má všetok kontext, nič nehádaj — všetky podklady sú in-repo.

---

## 0. Pre-flight — overiť aktuálny stav repa

**Tento prompt predpokladá, že PR-G + PR-H z `_fe-fix-prompt-pass4.md` sú merged.** Pred začatím:

```bash
git pull origin main
git log --oneline -10
# Hľadaj PR-G (UX backlog: F-NEW-06/09/10/12/19/20 + 08 dokončenie)
# Hľadaj PR-H (workflow: W-01..W-05, F-NEW-21, 22)
```

Ak tieto PR-ká **chýbajú** — STOP a najprv urob `_fe-fix-prompt-pass4.md`. Tento prompt na nich stavia.

Ak sú merged, spusti baseline walkthrough:

```bash
WALKTHROUGH_LABEL=pre-pass-5 pnpm test:walk
jq '[.[] | select(.a11ySerious | length > 0)] | length' \
  tmp/walkthrough-shots/pre-pass-5/_findings.json
# expected: 0 (žiadna regresia po PR-G/H)
```

Ak je výstup `> 0`, **najprv vyriešiť regresie**, potom pokračovať s polish ticketmi.

Ak je `pnpm test:walk` neexistujúci script, znamená to že **W-02 nebol implementovaný v PR-H** — fallback na `pnpm exec playwright test --project=chromium walkthrough.spec.ts`. Otvor `@decision-needed` issue a doplniť W-02 v tomto release.

---

## 1. Kontext a ciele

Si FE developer na Watt City (Next.js 16 / React 19.2 / Tailwind v4, default skin `pko`).

Tento release uzatvára **polish backlog** z Pass-3/Pass-4 + finalizuje produkt pred PKO partner showcase. Po tomto release **by sa nemali musieť robiť žiadne ďalšie UX iterácie** pred demo.

**Tvoj backlog:**
- `docs/pko-redesign/_ux-pass-4.md` Časť 5 „Sprint C-tail" — F-NEW-05/13/14/15/16/17/18
- `docs/pko-redesign/_ux-pass-3.md` — kontext + originálne návrhy fixov

Spec hierarchy pri konflikte:
`01-BRAND-MANUAL.md` > `02-DESIGN-TOKENS.md` > `03-COMPONENTS.md` > aktuálny kód.

Prečítaj v tomto poradí **predtým** než začneš čokoľvek meniť:

1. `docs/pko-redesign/_ux-pass-4.md` — Časť 1 status detail + Časť 5 Sprint C-tail
2. `docs/pko-redesign/_ux-pass-3.md` — F-NEW-05/13/14/15/16/17/18 detail
3. `AGENTS.md` — vizuálne rules
4. `docs/pko-redesign/01-BRAND-MANUAL.md` §1, §2, §7, §12

---

## 2. Scope fence — čo **NEROBIŤ**

- ❌ Nepridávať nové features. Iba polish + DX.
- ❌ Nemeniť hernú logiku, DB, API, routing.
- ❌ Nemeniť `[data-skin="core"]` CSS.
- ❌ Nezavádzať dark-mode pko variant.
- ❌ Nemeniť `_ux-pass-3.md` ani `_ux-pass-4.md` mimo `STATUS: FIXED in PR-X` anotácií.
- ❌ Žiadne `--no-verify` commits, žiadne force-push.
- ❌ **F-NEW-17 (Help/FAQ)** — vyžaduje **product decision** o FAQ obsahu. Bez decision implementuj iba **„Tutorial replay" položku** (replay onboarding) — nie FAQ link, nie Kontakt link. FAQ + Kontakt zostávajú „wkrótce" placeholdermi v footri ako sú dnes.
- ❌ Nezavádzať novú ikonografickú knižnicu — Lucide bola v `01-BRAND-MANUAL.md` §8 odporúčaná, ale **nie je v dependencies**. Polish tickety použijú existujúce inline SVG / emoji glyph.
- ❌ Nepripravovať „Sprint D" — tento release je posledný UX iterácia pred PKO showcase.

---

## 3. Quality gates — musí platiť pred každým PR

```bash
pnpm lint
pnpm typecheck                                 # (po W-02 v PR-H)
pnpm test                                      # vitest
pnpm test:e2e                                  # playwright (chromium projekt)
pnpm test:walk                                 # walkthrough (separate projekt po W-04)
pnpm build
```

**Walkthrough gate (musí ostať):**
```bash
jq '[.[] | select(.a11ySerious | length > 0)] | length' \
  tmp/walkthrough-shots/current/_findings.json   # expected: 0
jq '[.[] | select(.consoleErrors | length > 0)] | length' \
  tmp/walkthrough-shots/current/_findings.json   # expected: 0
```

**CI gate (po H-01):** GitHub Actions pipeline musí byť zelený pred merge.

---

## 4. Plán práce — 7 polish ticketov v 1 zoskupený PR

Tento release je rozhodnutý **ako jeden PR** (PR-I) — všetko sú malé, ortogonálne fixy v rôznych komponentoch. Recenzia je rýchla, nemá zmysel rozdeľovať.

---

### I-01 · F-NEW-05 — `/o-platforme` sticky TOC
**Súbor:** `app/o-platforme/page.tsx`

**Stav po Pass-4:** Round 2.5 zmenil section order (How → Progression → Science → Team → Sponsors → AI pipeline → Tech → Web3 → Roadmap), ale TOC neexistuje. Stránka je stále veľký scroll.

**Implementácia:**

1. **Pridať id na každý `<h2>`/`<section>`:**
   ```tsx
   <section id="how" className="section-y">...
   <section id="progression" className="section-y">...
   <section id="science" className="section-y">...
   <section id="team" className="section-y">...
   <section id="sponsors" className="section-y">...
   <section id="pipeline" className="section-y">...
   <section id="stack" className="section-y">...
   <section id="web3" className="section-y">...
   <section id="roadmap" className="section-y">...
   ```

2. **Wrapni page content do grid layoutu (desktop only):**
   ```tsx
   <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
     <aside className="hidden lg:block">
       <nav aria-label={d.aboutPage.tocLabel} className="sticky top-24 flex flex-col gap-2">
         {SECTIONS.map(({id, label}) => (
           <a key={id} href={`#${id}`}
              className="t-body-sm text-[var(--ink-muted)] hover:text-[var(--accent)] py-1 transition-colors">
             {label}
           </a>
         ))}
       </nav>
     </aside>
     <main>... existing content ...</main>
   </div>
   ```

3. **Mobile fallback (bonus, ak čas):**
   - Sticky chip-row hore ihneď pod nav: `<div className="lg:hidden sticky top-[56px] bg-[var(--surface)] border-b border-[var(--line)] overflow-x-auto">` → horizontálny scroll s anchor chips. Skip ak časovo náročné — desktop TOC je dôležitejší.

4. **i18n keys** — pridať `aboutPage.toc.{how,progression,science,team,sponsors,pipeline,stack,web3,roadmap,label}` × 4 lokále.

**Acceptance:**
- Desktop ≥ lg: vidím sticky TOC vľavo. Click skrolne na sekciu.
- Mobile: bez TOC (alebo s mobile chip-row ak implementované) — žiadna regresia.
- A11y: `<nav aria-label>` + skip-link sa neporušil.

---

### I-02 · F-NEW-13 — ResourceBar drop `font-mono`
**Súbor:** `components/resource-bar.tsx:29`

**Zmena:**
```diff
- className="flex items-center gap-1.5 flex-wrap text-xs font-mono tabular-nums sm:gap-3"
+ className="flex items-center gap-1.5 flex-wrap text-xs tabular-nums sm:gap-3"
```

**Pozor:** zachovať `tabular-nums` (čísla zarovnané) aj keď drop `font-mono`. Inter má `tnum` OpenType feature.

**Acceptance:**
- ResourceBar číslice sú v Inter (sans-serif), nie Geist Mono.
- Hodnoty zostávajú zarovnané (tabular figures).
- Žiadny vizuálny shift v alignment.

---

### I-03 · F-NEW-14 — Cookie banner padding-bottom overlap fix
**Súbory:** `components/cookie-consent.tsx` + `app/globals.css`

**Stav po Pass-4:** Banner po Round 2.5 je compact single-row + ✕ dismiss. Po H-02 (auto-dismiss po 3 navigations) dôležitosť klesla, ale **prvé pristúpenie** stále má banner zaberajúci ~50px na spodu, ktorý prekrýva CTA na `/dla-szkol` (Wypróbuj demo / Zapisz się jako nauczyciel).

**Implementácia:**

1. **CSS variable approach v `app/globals.css`:**
   ```css
   :root { --cookie-bar-h: 0px; }
   :root[data-cookie-visible="true"] { --cookie-bar-h: 56px; }
   @media (min-width: 640px) { :root[data-cookie-visible="true"] { --cookie-bar-h: 48px; } }
   body { padding-bottom: var(--cookie-bar-h); transition: padding-bottom 200ms ease; }
   ```

2. **`components/cookie-consent.tsx`** — pri mount/dismiss:
   ```tsx
   useEffect(() => {
     document.documentElement.dataset.cookieVisible = visible ? "true" : "false";
     return () => { delete document.documentElement.dataset.cookieVisible; };
   }, [visible]);
   ```

**Pozor:**
- `transition: padding-bottom` musí mať `prefers-reduced-motion: reduce` override (existing global rule v globals.css to už pokrýva).
- Sticky bottom-tabs (mobile) — ak existujú v aktuálnom layout, overiť že sa nezduplikujú.

**Acceptance:**
- Otvor `/dla-szkol` v dev — final CTA „Wypróbuj demo" nie je prekrytá cookie bannerom.
- Po dismiss bannera sa body padding-bottom plynulo schová.
- Žiadne layout shift po reload (banner state z localStorage načítaný synchronne pred prvý paint).

---

### I-04 · F-NEW-15 — DisplayName nudge pre default username
**Súbor:** `components/dashboard.tsx`

**Implementácia:**

1. **Detekcia default username:** ak `state.profile?.displayName === username` (kde `username` je generated `wt_xxx` po registrácii) ALEBO `displayName === null/undefined`.

2. **Nový mini banner card** pred CityLevelCard:
   ```tsx
   {needsDisplayName && (
     <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3">
       <div className="flex items-start gap-3">
         <span className="text-2xl" aria-hidden>✨</span>
         <div>
           <p className="t-body-sm font-semibold">{d.dashboard.namePromptTitle}</p>
           <p className="t-caption text-[var(--ink-muted)]">{d.dashboard.namePromptBody}</p>
         </div>
       </div>
       <Link href="/profile" className="btn btn-secondary btn-sm shrink-0">
         {d.dashboard.namePromptCta}
       </Link>
     </div>
   )}
   ```

3. **i18n keys:**
   - `dashboard.namePromptTitle` = „Daj si swoje meno"
   - `dashboard.namePromptBody` = „Spolužiaci uvidia tvoje wybrane meno na klassroom-leaderboarde."
   - `dashboard.namePromptCta` = „Nastav meno"
   (× 4 lokále)

4. **Dismiss state (optional):** localStorage key `watt-city-name-prompt-dismissed`, pridať ✕ button. Skip ak časovo náročné — nudge môže ostať trvalý kým user nezmení displayName.

**Acceptance:**
- Fresh user vidí nudge medzi „First step" card a CityLevelCard.
- Po nastavení `displayName` v `/profile` (a redirect späť) nudge zmizne.
- Žiadny layout shift na re-render.

---

### I-05 · F-NEW-16 — Achievement empty state (folded do F-NEW-06)
**Status:** ak PR-G implementoval `EmptyState` primitív + applikoval ho na `/profile` achievements, **toto je už hotové**. Overiť screenshot z `tmp/walkthrough-shots/pre-pass-5/desktop__26-profile.png`.

Ak fresh user **nevidí 8 „Zablokowane" placeholderov ale `EmptyState` „🎖 Tvoj prvý medal čaká"** → mark `STATUS: FIXED via PR-G` v `_ux-pass-3.md` a skip tento ticket.

Ak stále vidí placeholdery → implementuj per `_fe-fix-prompt-pass4.md` G-03 step 3.

---

### I-06 · F-NEW-17 — „Tutorial replay" v navigácii (skratený scope)
**Súbory:** `components/site-nav.tsx`, `components/mobile-nav-drawer.tsx`

**Scope decision (per scope fence):** **Iba „Tutorial replay" položka.** FAQ + Kontakt zostávajú „wkrótce" v footri.

**Desktop implementácia:**
- V site-nav user dropdown (right-cluster pri `username`) pridať položku „Zobacz tutorial".
- Aktuálny site-nav nemá user dropdown — username + level chip sú inline. Pridať dropdown wrapper okolo username s items: „Zobacz tutorial", „Wyloguj" (presunúť LogoutButton dovnútra).
- Click „Zobacz tutorial" → reset localStorage `watt-city-onboarding-completed-v2` (alebo aktualne version key) + dispatch event ktorý OnboardingTour počúva.

**Mobile drawer implementácia:**
- V `MobileNavDrawer` footer (kde už je username + title display) pridať `<button>` „Zobacz tutorial" pred Wyloguj.

**Onboarding listener:**
- `components/onboarding-tour.tsx` — pridať event listener:
   ```tsx
   useEffect(() => {
     const handler = () => setShown(true);
     window.addEventListener("watt-city:replay-tutorial", handler);
     return () => window.removeEventListener("watt-city:replay-tutorial", handler);
   }, []);
   ```
- Trigger button:
   ```tsx
   <button onClick={() => {
     localStorage.removeItem("watt-city-onboarding-completed-v2");
     window.dispatchEvent(new Event("watt-city:replay-tutorial"));
   }}>{d.nav.replayTutorial}</button>
   ```

**i18n:**
- `nav.replayTutorial` = „Zobacz tutorial" × 4 lokále.

**Acceptance:**
- Logged-in user (kid/teacher/parent) má 1-click prístup k replay onboardingu.
- Click triggernue OnboardingTour znova bez page reload.
- Mobile drawer footer obsahuje položku.

---

### I-07 · F-NEW-18 — Avatar konsistencia (3 surfaces)
**Súbory:** `components/dashboard.tsx`, `app/leaderboard/page.tsx`, `components/friends-client.tsx`

**Predpoklad:** existuje `avatarFor()` helper v `lib/avatars.ts` alebo ekvivalent. Ak neexistuje, `grep -rn "avatar" lib/` na lokalizáciu. Ak naozaj chýba, **skip ticket a flag `@decision-needed`** — vyžaduje produktovú voľbu (avatar set + default).

**Predpokladajúc helper existuje:**

1. **Dashboard hero (`components/dashboard.tsx`):** vľavo od „Witaj, {username}" header pridať 48×48 avatar:
   ```tsx
   <div className="flex items-center gap-3">
     <div className="w-12 h-12 rounded-full border border-[var(--line)] inline-flex items-center justify-center text-2xl bg-[var(--surface-2)]" aria-hidden>
       {avatarFor(state.profile?.avatar)}
     </div>
     <div>
       <p className="text-sm text-[var(--ink-muted)]">{d.welcome}</p>
       <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
         {displayName ?? username}
       </h1>
     </div>
   </div>
   ```

2. **Leaderboard rows (`app/leaderboard/page.tsx`):** každý row dostane 24×24 avatar pred username:
   ```tsx
   <td className="flex items-center gap-2">
     <span className="text-base" aria-hidden>{avatarFor(entry.avatar)}</span>
     <span>{entry.displayName ?? entry.username}</span>
   </td>
   ```
   **Pozor:** leaderboard entry musí carry `avatar` field. Skontrolovať `lib/leaderboard.ts` typ. Ak chýba, treba server-side join — **toto môže byť scope creep**, eventualne fallback na initials.

3. **Friends list (`components/friends-client.tsx`):** každý friend row dostane avatar.

**Fallback:** ak avatar field nie je dostupný v leaderboard / friends entries (vyžaduje API zmenu = scope creep), implementuj iba dashboard hero + flag F-NEW-18-leaderboard ako follow-up.

**Acceptance:**
- Dashboard hero ukazuje avatar kid-a.
- Leaderboard má avatar v každom row (ak data dostupné, inak iba dashboard).
- Žiadny image load — emoji glyphy sú inline.

---

## 5. Per-PR checklist

```markdown
- [ ] Polish tickets I-01 až I-07 dokončené (vymenuj implementované, vyznač skipped + dôvod)
- [ ] pnpm typecheck / lint / test / e2e / walk / build — všetko zelené
- [ ] Walkthrough re-run: 0 a11y serious, 0 console, 0 page errors
- [ ] CI pipeline (po PR-H) zelená
- [ ] Žiadne brand discipline porušenia (border-[Npx≥2], shadow-[hard-offset], font-{800,900}, uppercase headings, hex mimo palety)
- [ ] Pred/po screenshot pre I-01 (TOC), I-04 (nudge), I-06 (tutorial replay), I-07 (avatar)
- [ ] _ux-pass-3.md / _ux-pass-4.md anotácie „STATUS: FIXED in PR-I" pridané pre F-NEW-05/13/14/15/16/17/18
```

---

## 6. Order of operations

Doporučené poradie (od najlacnejšieho po najdrahšie):

1. **I-02** — `font-mono` drop (1-line zmena).
2. **I-05** — overiť či PR-G už pokryl achievement empty state. Ak áno, mark FIXED. Ak nie, dokončiť.
3. **I-03** — cookie banner padding-bottom (CSS variable approach).
4. **I-04** — displayName nudge (krátka komponentová zmena).
5. **I-07** — avatar konsistencia (zložitosť závisí od `avatarFor` + leaderboard data shape).
6. **I-06** — tutorial replay (vyžaduje user dropdown wrapper v site-nav).
7. **I-01** — `/o-platforme` sticky TOC (najväčší zmena layoutu, možný regresie).

---

## 7. Output

Po dokončení PR-I:

1. **Update `_ux-pass-3.md`:** F-NEW-05/13/14/15/16/17/18 dostávajú „**STATUS: FIXED in PR-I**" anotácie.
2. **Update `_ux-pass-4.md`:** Časť 5 Sprint C-tail finalizovať na FIXED.
3. **Vyrobiť `_release-acceptance.md`** — finálny dokument pre PO:
   - Pass-3/4/5 nálezy + status (každý F-NEW = 1 riadok: ID, severity, status, PR).
   - Walkthrough metriky (final): a11y / console / page errors counts.
   - Workflow stav: CI green badge, scripts dostupné, pre-commit hooks active.
   - **Zoznam zostávajúcich `@decision-needed` items** ktoré PO musí prerušiť pred PKO showcase (napr. F-NEW-04 take-school-shots Voľba B/A, F-NEW-17 FAQ obsah, atď.).
   - **Final PO walkthrough kalendár** — návrh 30-min live session osobne (nie cez screenshoty) na 4 personas (anon visitor, kid, parent, teacher).

---

## 8. Po tomto release

**Post-release predpokladaný backlog (nie tento prompt):**
- Epic E4 (city-scene full 8-bucket SVG refactor) — `04-BACKLOG.md`. Plný redesign 1679-line SVG, 3-5 dní práce.
- F-NEW-04 take-school-shots Voľba B (ak PO zvolil) — seed demo class + headless capture pipeline.
- Real-device mobile matrix (per `README.md` future roadmap).
- Observability sink (Grafana/Datadog) — per `README.md`.
- School pricing per-class feature flag — per `README.md`.

Tieto sú **mimo scope** Pass-3/4/5. Ak PO eskaluje, otvoriť samostatný `_ux-pass-6.md` alebo `_post-release-roadmap.md`.

---

## 9. Acceptance pre PO (sekcia ktorá zaujíma decision-makera)

Po merge PR-I:

✅ **Vizuálne:** všetkých 18 Pass-3 findings + 4 Pass-4 vizuálne findings buď FIXED alebo dokumentované v `_release-acceptance.md` ako OUT-OF-SCOPE / decision-needed.
✅ **A11y:** axe-core scan na 56 navigationch ukazuje 0 serious findings.
✅ **DX:** CI pipeline beží na každý push/PR; pre-commit hook chytá broken lint; `pnpm review` je 1-line konsistencia gate.
✅ **Brand:** žiadne neon farby, žiadne hard-offset shadows, žiadne uppercase headings, žiadne `border-[Npx≥2]` v JSX.
✅ **Content:** všetky 4 lokále synchronné, žiadne placeholdery „PREVIEW · SOON" / „Noc nad Katowicami".

**Pripravené na PKO partner showcase.**
