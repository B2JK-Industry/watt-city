/* V4.10 — Żyrafa mascot (PKO Junior brand).
 *
 * Server component. Accepts `size` prop for placement flexibility:
 *   - `badge` — small corner marker (teacher dashboard + digest)
 *   - `hero`  — full-height welcome illustration (tour + landing)
 *
 * The SVG itself is a placeholder — PKO ships the final asset via
 * `public/pko-mascot.svg` and we swap via env (`NEXT_PUBLIC_PKO_MASCOT_URL`)
 * if the env override is set. Keeps the interface stable while the
 * asset is provided by the partner.
 */

import { resolveTheme, type SkinId } from "@/lib/theme";
import { getCurrentSkin } from "@/lib/skin-server";

type Props = {
  size?: "badge" | "hero";
  /** When true, only render if SKIN=pko. Otherwise never shown. */
  onlyWhenPko?: boolean;
  /** Optional override — callers that already resolved the skin
   *  synchronously can pass it to skip the `getCurrentSkin()` round
   *  trip. Left undefined in the common case. */
  skin?: SkinId;
};

/** Server component. Reads the `xp_skin` cookie via `getCurrentSkin`
 *  so it renders correctly regardless of whether the parent page
 *  threaded skin through as a prop. Safe to render from any server-
 *  component tree. */
export async function PkoMascot({ size = "badge", onlyWhenPko = true, skin }: Props) {
  const resolved = skin ?? (await getCurrentSkin());
  const theme = resolveTheme(resolved);
  if (onlyWhenPko && theme.id !== "pko") return null;
  const mascot = theme.mascot;
  if (!mascot) return null;

  const dim = size === "hero" ? 180 : 56;
  const override = process.env.NEXT_PUBLIC_PKO_MASCOT_URL;

  return (
    <div
      role="img"
      aria-label={mascot.label}
      style={{ width: dim, height: dim }}
      className="inline-flex items-center justify-center"
    >
      {override ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={override} alt={mascot.label} width={dim} height={dim} />
      ) : (
        <span
          // SVG is trusted internal asset — markup is fixed in the theme
          // token and never user-supplied.
          dangerouslySetInnerHTML={{ __html: mascot.svg }}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
