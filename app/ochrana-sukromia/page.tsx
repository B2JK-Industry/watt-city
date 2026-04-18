import Link from "next/link";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const metadata = {
  title: "Ochrona prywatności · Watt City",
};

export default async function PrivacyPage() {
  const lang = await getLang();
  const dict = dictFor(lang);
  const t = dict.privacyPage;
  const f = t.dataFields;

  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-3xl">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="brutal-heading text-3xl sm:text-4xl">{t.title}</h1>
          <span
            className="brutal-tag"
            style={{ background: "var(--neo-lime)", color: "#0a0a0f" }}
          >
            {t.tag}
          </span>
        </div>
        <p className="text-zinc-400">{t.note}</p>
      </header>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">1 · {t.whoTitle}</h2>
        <p className="text-sm text-zinc-300">{t.whoBody}</p>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">2 · {t.whatTitle}</h2>
        <p className="text-sm text-zinc-400">{t.whatIntro}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <DataRow
            field={dict.auth.usernameLabel}
            value={f.usernameValue}
            purpose={dict.leaderboard.title}
            retention={f.untilDelete}
          />
          <DataRow
            field={dict.auth.passwordLabel}
            value={f.passwordValue}
            purpose={dict.nav.login}
            retention={f.untilDelete}
            note={f.passwordNote}
          />
          <DataRow
            field={dict.dashboard.totalWatts}
            value={f.wattsValue}
            purpose={dict.leaderboard.title}
            retention={f.untilDelete}
          />
          <DataRow
            field={t.whatTitle}
            value={f.statsValue}
            purpose={dict.dashboard.yourBuildingTitle}
            retention={f.untilDelete}
          />
          <DataRow
            field={dict.duel.title}
            value={f.duelsValue}
            purpose="PvP"
            retention={f.duelTtl}
          />
          <DataRow
            field="Session cookie"
            value={f.sessionValue}
            purpose={dict.nav.login}
            retention={f.sessionTtl}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">{t.whatNotStored}</p>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">3 · {t.whereTitle}</h2>
        <ul className="text-sm text-zinc-300 space-y-1.5 list-disc pl-5">
          {t.whereList.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">4 · {t.rightsTitle}</h2>
        <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-5">
          {t.rightsList.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">5 · {t.aiTitle}</h2>
        <p className="text-sm text-zinc-300">{t.aiIntro}</p>
        <ul className="text-sm text-zinc-300 space-y-1.5 list-disc pl-5">
          {t.aiList.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">6 · {t.securityTitle}</h2>
        <ul className="text-sm text-zinc-300 space-y-1.5 list-disc pl-5">
          {t.securityList.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="brutal-heading text-lg">7 · {t.minorsTitle}</h2>
        <p className="text-sm text-zinc-300">{t.minorsBody}</p>
      </section>

      <section className="card p-5 flex flex-col gap-3 border-[var(--accent)]">
        <h2 className="brutal-heading text-lg">8 · {t.disclaimerTitle}</h2>
        <p className="text-sm text-zinc-300">{t.disclaimerBody}</p>
      </section>

      <footer className="text-xs text-zinc-500 border-t-2 border-[var(--ink)]/30 pt-4">
        {t.version}{" "}
        <Link href="/" className="underline">
          {t.backHome}
        </Link>
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
      <p className="text-xs font-mono text-zinc-300 mt-1">{value}</p>
      <p className="text-xs text-zinc-400 mt-2">
        <span className="text-zinc-500">Retention:</span> {retention}
      </p>
      <p className="text-xs text-zinc-400">
        <span className="text-zinc-500">Purpose:</span> {purpose}
      </p>
      {note && <p className="text-[11px] text-zinc-500 mt-1 italic">{note}</p>}
    </div>
  );
}
