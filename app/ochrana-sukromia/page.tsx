import Link from "next/link";

export const metadata = {
  title: "Ochrana súkromia · XP Arena",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-3xl">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">
            Ochrana súkromia
          </h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}
          >
            Legal from Day One
          </span>
        </div>
        <p className="text-zinc-400">
          Túto stránku píšeme{" "}
          <strong className="text-[var(--foreground)]">pred</strong> tým, než
          prvý hráč stlačí „Registrácia". Je to privacy receipt — nie hmlistý
          právnický text, ale konkrétny zoznam toho, čo uchovávame, kde, prečo
          a ako si to vieš vyžiadať späť. Podľa pravidla <em>ETHLegal from Day
          One</em>: právo nie je bariéra, je súčasť produktu.
        </p>
      </header>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">1 · Kto spravuje tvoje dáta</h2>
        <p className="text-sm text-zinc-300">
          Prevádzkovateľom a správcom údajov v zmysle GDPR čl. 4 ods. 7 je tím{" "}
          <strong>B2JK-Industry</strong> (hackathonový tím ETHSilesia 2026,
          Katowice, PL). Kontakt pre právne otázky: e-mail v README repa.{" "}
          <a
            href="https://github.com/B2JK-Industry/xp-arena-ETHSilesia2026"
            className="underline text-[var(--accent)]"
          >
            Verejný zdrojový kód
          </a>
          .
        </p>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">2 · Čo presne ukladáme</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <DataRow
            field="Používateľské meno"
            value="&lt;to, čo si zadal&gt;"
            purpose="identita v hre a v rebríčkoch"
            retention="kým si účet nezmažeš"
          />
          <DataRow
            field="Heslo"
            value="scrypt hash + soľ (64 bajtov)"
            purpose="prihlásenie"
            retention="kým si účet nezmažeš"
            note="Originálne heslo neuchovávame a ani ho nevieme prečítať."
          />
          <DataRow
            field="Watty a skóre"
            value="číselné hodnoty per hra"
            purpose="rebríčky a progression"
            retention="kým si účet nezmažeš"
          />
          <DataRow
            field="Štatistiky hier"
            value="počet pokusov, best skóre, čas posl. hry"
            purpose="dashboard"
            retention="kým si účet nezmažeš"
          />
          <DataRow
            field="Duely"
            value="kód, odpovede, časy kôl"
            purpose="PvP match"
            retention="automaticky 6 hodín (Redis TTL)"
          />
          <DataRow
            field="Session cookie"
            value="HMAC-signed, HttpOnly, 30 dní"
            purpose="aby si nemusel stále prihlasovať"
            retention="max 30 dní alebo do odhlásenia"
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          <strong>Čo NEukladáme:</strong> e-mail, telefón, reálne meno, IP
          adresu, polohu, analytický fingerprint, third-party cookies,
          remarketingové tagy. Nepoužívame Google Analytics, Meta Pixel,
          Hotjar ani ekvivalenty.
        </p>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">3 · Kde to fyzicky leží</h2>
        <ul className="text-sm text-zinc-300 space-y-1.5 list-disc pl-5">
          <li>
            <strong>Redis databáza:</strong> Upstash, EU (Frankfurt). Sorted
            sets pre rebríčky, JSON pre účty a duely.
          </li>
          <li>
            <strong>Aplikačná vrstva:</strong> Vercel Edge + Node runtime, EU
            regióny.
          </li>
          <li>
            <strong>Kód:</strong> GitHub, privátny repozitár počas hackathonu,
            po skončení public.
          </li>
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">
          4 · Tvoje práva podľa GDPR
        </h2>
        <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-5">
          <li>
            <strong>Čl. 15 — prístup:</strong> celá tvoja dátová stopa je
            viditeľná v dashboarde (Watty, hry, duely). Nič skryté.
          </li>
          <li>
            <strong>Čl. 16 — oprava:</strong> meno si teraz nemôžeš premenovať,
            ale môžeš účet zmazať a založiť nový.
          </li>
          <li>
            <strong>Čl. 17 — vymazanie („right to be forgotten"):</strong>{" "}
            jedno kliknutie v dashboarde → zmaže sa účet, skóre a všetky
            záznamy z rebríčkov (aj podium).
          </li>
          <li>
            <strong>Čl. 20 — prenositeľnosť:</strong> otvorené API{" "}
            <code>/api/me</code> (GET) vráti tvoje dáta v JSON. Zobrať a
            uložiť, kľudne aj skriptom.
          </li>
          <li>
            <strong>Čl. 21 — námietka:</strong> právny základ pre spracovanie
            je tvoj súhlas pri registrácii. Odhlásenie súhlasu = vymazanie
            účtu.
          </li>
          <li>
            <strong>Čl. 22 — automatizované rozhodovanie:</strong>{" "}
            nevyužívame. Rebríček je deterministický, duel má seed a fixné
            pravidlá.
          </li>
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">5 · AI a dáta</h2>
        <p className="text-sm text-zinc-300">
          Keď pustíme „AI výzvu dňa" (v roadmape):
        </p>
        <ul className="text-sm text-zinc-300 space-y-1.5 list-disc pl-5">
          <li>
            Claude bude generovať iba samotné <strong>zadanie hry</strong>{" "}
            (kvíz, slová, čísla). Nikdy nevidí tvoje meno, skóre ani ID.
          </li>
          <li>
            Výstupy AI zverejňujeme s odznakom{" "}
            <span className="brutal-tag" style={{ background: "var(--neo-pink)", color: "#0a0a0f" }}>
              🤖 AI
            </span>{" "}
            — nikdy sa netvárime, že ich napísal človek.
          </li>
          <li>
            Tvoje odpovede do AI modelu neposielame. Zostávajú v našom Upstash.
          </li>
          <li>
            Ak sa AI zmýli v obsahu (halucinácia), môžeš to nahlásiť cez
            GitHub issue — opravíme a re-deploy.
          </li>
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">6 · Bezpečnosť</h2>
        <ul className="text-sm text-zinc-300 space-y-1.5 list-disc pl-5">
          <li>
            Heslá: <strong>scrypt</strong> s náhodnou 16-bajtovou soľou
            (Node.js <code>crypto.scryptSync</code>).
          </li>
          <li>
            Sessions: HMAC-SHA256 podpísaný cookie, <code>HttpOnly</code>,{" "}
            <code>Secure</code>, <code>SameSite=Lax</code>, 30-dňový maxAge.
          </li>
          <li>
            API vstupy validované cez <strong>Zod</strong> (žiadne „anything
            goes").
          </li>
          <li>
            Incident response: ak nájdeš zraniteľnosť, napíš nám cez GitHub
            security advisory.
          </li>
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">7 · Deti a mládež</h2>
        <p className="text-sm text-zinc-300">
          Platforma cieli na Gen Z (15–20 rokov). Pre osoby mladšie ako 16{" "}
          (v PL hranica GDPR pre súhlas) odporúčame súhlas rodiča. Nezbierame
          žiadne osobné údaje, ktoré by umožňovali identifikáciu dieťaťa
          mimo hry.
        </p>
      </section>

      <section className="card p-5 flex flex-col gap-3 border-[var(--accent)]">
        <h2 className="brutal-heading text-lg">8 · Hackathon disclaimer</h2>
        <p className="text-sm text-zinc-300">
          XP Arena bola postavená{" "}
          <strong>počas ETHSilesia 2026</strong> (17.–19. apríl 2026) v
          Katowiciach. Ide o <em>prototyp</em> — finančné rady v hrách nemajú
          charakter investičného poradenstva v zmysle MiFID II. Obsah hier je
          pre edukačné účely a je overený proti verejne dostupným zdrojom, ale
          nenahrádza konzultáciu s bankou, poradcom, alebo{" "}
          <a
            href="https://www.knf.gov.pl/"
            className="underline text-[var(--accent)]"
            target="_blank"
            rel="noreferrer"
          >
            KNF
          </a>{" "}
          (Komisja Nadzoru Finansowego).
        </p>
      </section>

      <footer className="text-xs text-zinc-500 border-t-2 border-[var(--ink)]/30 pt-4">
        Verzia 1.0 · 2026-04-18 · <Link href="/" className="underline">Späť na domov</Link>
      </footer>
    </div>
  );
}

function DataRow({
  field,
  value,
  purpose,
  retention,
  note,
}: {
  field: string;
  value: string;
  purpose: string;
  retention: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border-[3px] border-[var(--ink)] bg-[var(--surface-2)] p-3">
      <p className="font-black uppercase text-xs tracking-widest text-[var(--accent)]">
        {field}
      </p>
      <p className="text-xs font-mono text-zinc-300 mt-1" dangerouslySetInnerHTML={{ __html: value }} />
      <p className="text-xs text-zinc-400 mt-2">
        <span className="text-zinc-500">Účel:</span> {purpose}
      </p>
      <p className="text-xs text-zinc-400">
        <span className="text-zinc-500">Uchovávame:</span> {retention}
      </p>
      {note && <p className="text-[11px] text-zinc-500 mt-1 italic">{note}</p>}
    </div>
  );
}
