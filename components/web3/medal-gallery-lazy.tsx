"use client";

/* W5 — client-side dynamic loader for Web3MedalGallery.
 *
 * Next 16 blocks `ssr: false` on dynamic() calls inside server
 * components. By declaring the dynamic import inside a "use client"
 * file, the wagmi / viem / rainbowkit bundle lands in a separate
 * chunk that only loads when the profile page actually renders the
 * gallery. With NEXT_PUBLIC_WEB3_ENABLED=false (default), the
 * profile's server component skips mounting this loader entirely,
 * so no chunk is even requested.
 */

import dynamic from "next/dynamic";
import type { AchievementId } from "@/lib/achievements";

type Strings = {
  connectPromptTitle: string;
  connectPromptBody: string;
  mintableHeading: string;
  mintedHeading: string;
  mintCta: string;
  minting: string;
  minted: string;
  burned: string;
  viewOnExplorer: string;
  noMedalsYet: string;
  signatureRequestedTitle: string;
  signatureRequestedBody: string;
  errorTitle: string;
};

type Props = {
  username: string;
  ownedAchievements: AchievementId[];
  achievementLabels: Record<AchievementId, string>;
  achievementIcons: Record<AchievementId, string>;
  strings: Strings;
};

const Inner = dynamic<Props>(
  () => import("./medal-gallery").then((m) => m.Web3MedalGallery),
  { ssr: false, loading: () => null },
);

export default function Web3MedalGalleryLazy(props: Props) {
  return <Inner {...props} />;
}
