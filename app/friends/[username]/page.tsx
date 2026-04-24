import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { getPlayerState } from "@/lib/player";
import { computePlayerTier } from "@/lib/buildings";
import { userStats } from "@/lib/leaderboard";
import { canViewProfile, readPrivacy } from "@/lib/friends";
import { kvGet } from "@/lib/redis";
import { avatarFor } from "@/lib/avatars";
import {
  SLOT_MAP,
  getCatalogEntry,
} from "@/lib/building-catalog";

export const dynamic = "force-dynamic";

export default async function FriendCityPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [{ username }, session, lang] = await Promise.all([
    params,
    getSession(),
    getLang(),
  ]);
  if (!session) redirect("/login");
  const userRec = await kvGet(`xp:user:${username}`);
  if (!userRec) notFound();

  const canView = await canViewProfile(username, session.username);
  if (!canView) {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <h1 className="text-xl font-semibold">
          {{ pl: "Profil niedostępny", uk: "Недоступно", cs: "Nedostupné", en: "Private profile" }[lang]}
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">
          {{
            pl: "Ten użytkownik ograniczył widoczność swojego miasta do znajomych.",
            uk: "Користувач дозволив бачити місто тільки друзям.",
            cs: "Tento uživatel povolil zobrazení města jen přátelům.",
            en: "This user only shares their city with friends.",
          }[lang]}
        </p>
      </div>
    );
  }

  const [state, stats, privacy] = await Promise.all([
    getPlayerState(username),
    userStats(username),
    readPrivacy(username),
  ]);
  const tier = computePlayerTier(state.buildings);
  const av = avatarFor(state.profile?.avatar);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex items-center gap-3">
        <span
          className="w-12 h-12 border border-[var(--line)] rounded flex items-center justify-center text-3xl"
          style={{ color: av.hue }}
        >
          {av.emoji}
        </span>
        <div>
          <h1 className="section-heading text-2xl">
            {state.profile?.displayName ?? username}
          </h1>
          <div className="flex gap-2 text-xs">
            <span className="chip">Tier T{tier}</span>
            {privacy.cashflowVisible && (
              <span className="chip">
                {stats.globalXP.toLocaleString("pl-PL")} W
              </span>
            )}
          </div>
        </div>
      </header>
      <section className="card p-3 overflow-x-auto">
        <svg viewBox="0 0 1800 460" className="w-full h-auto">
          <rect x={0} y={0} width={1800} height={460} fill="#020617" />
          <line x1={0} y1={400} x2={1800} y2={400} stroke="#1e293b" strokeWidth={4} />
          {SLOT_MAP.map((slot) => {
            const building = state.buildings.find((b) => b.slotId === slot.id);
            const cat = building ? getCatalogEntry(building.catalogId) : null;
            return (
              <g key={slot.id}>
                <rect
                  x={slot.x}
                  y={slot.y}
                  width={slot.w}
                  height={slot.h}
                  fill={cat?.bodyColor ?? "rgba(100,116,139,0.1)"}
                  stroke="#334155"
                  strokeWidth={2}
                  rx={3}
                />
                {cat && (
                  <>
                    <rect
                      x={slot.x}
                      y={slot.y}
                      width={slot.w}
                      height={12}
                      fill={cat.roofColor}
                      stroke="#0a0a0f"
                      strokeWidth={2}
                    />
                    <text
                      x={slot.x + slot.w / 2}
                      y={slot.y + slot.h / 2 + 6}
                      textAnchor="middle"
                      fontSize={18}
                    >
                      {cat.glyph}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </section>
      <Link href="/friends" className="text-sm underline text-[var(--ink-muted)]">
        ← {{ pl: "Moi znajomi", uk: "Мої друзі", cs: "Moji přátelé", en: "My friends" }[lang]}
      </Link>
    </div>
  );
}
