import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { achievementStatus, sweepAchievements } from "@/lib/achievements";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { userStats } from "@/lib/leaderboard";
import { ProfileEdit } from "@/components/profile-edit";
import { ParentInviteCard } from "@/components/parent-invite-card";
import { avatarFor } from "@/lib/avatars";
import { web3Enabled } from "@/lib/web3/client";
import { Web3MedalGallerySection } from "@/components/web3/medal-gallery-section";
import { EmptyState } from "@/components/empty-state";

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
        <h1 className="section-heading text-3xl">{heading}</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <span
            className="w-10 h-10 rounded border border-[var(--line)] flex items-center justify-center text-2xl"
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
      {/* Cleanup issue 4 — V4.6 parent-invite flow needs a UI entry point;
          the V4.6 backend routes exist but /profile had no "Generate code"
          affordance, so the full kid→code→parent flow was unreachable. */}
      <ParentInviteCard lang={lang} />
      {/* I-05 (F-NEW-16) — for fresh users with 0 owned achievements,
          replace the 8-locked grid with a focused EmptyState. The
          "8 zámkov" pattern read as "you have nothing"; the empty
          state reframes it as "your first medal is one game away".
          Once any achievement is owned the grid renders normally. */}
      {status.every((a) => !a.owned) ? (
        <EmptyState
          icon="🎖"
          title={
            {
              pl: "Twoje pierwsze odznaczenie czeka",
              uk: "Перша нагорода чекає на тебе",
              cs: "První medaile na tebe čeká",
              en: "Your first medal is waiting",
            }[lang]
          }
          body={
            {
              pl: "Zagraj minigrę i zacznij zbierać odznaki. Każda gra otwiera kolejne osiągnięcie.",
              uk: "Зіграй у міні-гру та збирай нагороди. Кожна гра відкриває нове досягнення.",
              cs: "Zahraj minihru a začni sbírat medaile. Každá hra odemyká další úspěch.",
              en: "Play a mini-game and start collecting badges. Each game unlocks a new achievement.",
            }[lang]
          }
          cta={{
            href: "/games",
            label: {
              pl: "Zagraj minigrę",
              uk: "Зіграти міні-гру",
              cs: "Zahrát minihru",
              en: "Play a mini-game",
            }[lang],
            variant: "sales",
          }}
        />
      ) : (
        <section className="card p-4 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{achLabel}</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {status.map(({ id, owned, def }) => (
              <li
                key={id}
                className={
                  "border border-[var(--line)] rounded p-3 flex flex-col items-center gap-1 text-center " +
                  (owned ? "" : "opacity-50")
                }
              >
                <span className="text-3xl" aria-hidden>
                  {owned ? def.icon : "🔒"}
                </span>
                <strong className="text-xs">
                  {def.labels[lang]}
                </strong>
                <p className="text-[11px] text-[var(--ink-muted)] leading-snug">
                  {owned ? def.descriptions[lang] : lockedLabel}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {web3Enabled() && (
        <Web3MedalGallerySection username={session.username} lang={lang} />
      )}
    </div>
  );
}
