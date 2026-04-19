import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { achievementStatus, sweepAchievements } from "@/lib/achievements";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { userStats } from "@/lib/leaderboard";
import { ProfileEdit } from "@/components/profile-edit";
import { avatarFor } from "@/lib/avatars";
import { web3Enabled, fetchOnchainMedals } from "@/lib/web3/client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");

  await sweepAchievements(session.username);
  const [status, state, stats] = await Promise.all([
    achievementStatus(session.username),
    getPlayerState(session.username),
    userStats(session.username),
  ]);
  const tier = computePlayerTier(state.buildings);
  const shareUrl = `/profile/${encodeURIComponent(session.username)}`;
  const av = avatarFor(state.profile?.avatar);

  const heading = {
    pl: "Profil",
    uk: "Профіль",
    cs: "Profil",
    en: "Profile",
  }[lang];
  const achLabel = {
    pl: "Osiągnięcia",
    uk: "Досягнення",
    cs: "Úspěchy",
    en: "Achievements",
  }[lang];
  const lockedLabel = {
    pl: "Zablokowane",
    uk: "Заблоковано",
    cs: "Zamčeno",
    en: "Locked",
  }[lang];
  const shareLabel = {
    pl: "Profil publiczny",
    uk: "Публічний профіль",
    cs: "Veřejný profil",
    en: "Public profile",
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="brutal-heading text-3xl">{heading}</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <span
            className="w-10 h-10 rounded border-[3px] border-[var(--ink)] flex items-center justify-center text-2xl"
            aria-hidden
            style={{ color: av.hue }}
          >
            {av.emoji}
          </span>
          <span className="chip">
            <strong>{state.profile?.displayName ?? session.username}</strong>
          </span>
          <span className="chip">
            Tier <strong>T{tier}</strong>
          </span>
          <span className="chip">
            {stats.globalXP.toLocaleString("pl-PL")} W ·{" "}
            {stats.globalRank !== null ? `#${stats.globalRank}` : "–"}
          </span>
          <a
            href={shareUrl}
            className="chip hover:text-[var(--accent)] underline"
          >
            {shareLabel}
          </a>
        </div>
      </header>
      <ProfileEdit
        lang={lang}
        initialAvatar={state.profile?.avatar}
        initialDisplayName={state.profile?.displayName}
      />
      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-black uppercase">{achLabel}</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {status.map(({ id, owned, def }) => (
            <li
              key={id}
              className={
                "border-2 border-[var(--ink)]/40 rounded p-3 flex flex-col items-center gap-1 text-center " +
                (owned ? "" : "opacity-50")
              }
            >
              <span className="text-3xl" aria-hidden>
                {owned ? def.icon : "🔒"}
              </span>
              <strong className="text-xs uppercase tracking-wider">
                {def.labels[lang]}
              </strong>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {owned ? def.descriptions[lang] : lockedLabel}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {web3Enabled() && (
        <OnchainMedalsSection
          username={session.username}
          lockedLabel={lockedLabel}
        />
      )}
    </div>
  );
}

async function OnchainMedalsSection({
  username,
  lockedLabel,
}: {
  username: string;
  lockedLabel: string;
}) {
  // Phase 8 scaffold — render on-chain medals when web3 is enabled AND
  // the user has a linked wallet. In the mock path (`web3Enabled()` false),
  // this component doesn't mount at all; when enabled but no wallet, we
  // show the opt-in CTA. Real wallet linking (Phase 8.1.5) adds a separate
  // endpoint; for now the wallet value is read from the player state.
  const medals = await fetchOnchainMedals(null);
  return (
    <section className="card p-4 flex flex-col gap-3 border-[var(--neo-cyan)]">
      <h2 className="text-lg font-black uppercase">On-chain medals (beta)</h2>
      <p className="text-xs text-zinc-400">
        {lockedLabel} — połącz portfel (Base / Coinbase Smart Wallet), by
        zamintować medale on-chain za każde osiągnięcie. Brak opłat dla
        gracza.
      </p>
      {medals.length === 0 ? (
        <p className="text-xs text-zinc-500">
          Konto {username} nie ma jeszcze medali on-chain.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {medals.map((m) => (
            <li
              key={m.tokenId}
              className="border-2 border-[var(--neo-cyan)]/40 rounded p-3 flex flex-col items-center gap-1 text-center"
            >
              <span className="text-3xl" aria-hidden>
                🏅
              </span>
              <code className="text-[10px] text-zinc-400">{m.tokenId.slice(0, 10)}</code>
              <span className="text-[11px] text-zinc-500">
                {new Date(m.mintedAt).toLocaleDateString("pl-PL")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
