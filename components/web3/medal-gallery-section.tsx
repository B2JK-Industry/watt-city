/* W5 — server-side gate for the on-chain medal gallery.
 *
 * Runs only when NEXT_PUBLIC_WEB3_ENABLED === "true" (enforced by the
 * caller in app/profile/page.tsx). Branches three ways:
 *   a) user hasn't opted in (onboarding.web3OptIn !== true) →
 *      render a static opt-in CTA, no client JS shipped.
 *   b) user is under 16 AND no parental consent → render the
 *      "wymaga zgody rodzica" variant (still static).
 *   c) all gates satisfied → dynamic-import the client gallery
 *      (ssr:false). wagmi/viem/rainbowkit load here and nowhere else.
 */

import {
  ACHIEVEMENT_DEFS,
  ownedAchievements,
  type AchievementId,
} from "@/lib/achievements";
import { readWeb3OptIn } from "@/lib/web3/consent";
import {
  readAgeBucket,
  requiresParentalConsent,
  hasParentalConsent,
} from "@/lib/gdpr-k";
import type { Lang } from "@/lib/i18n";
import Web3MedalGalleryLazy from "./medal-gallery-lazy";

type GalleryStrings = {
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

type Strings = GalleryStrings & {
  /** Server-only copy rendered before the client mounts. */
  optInRequired: string;
  parentConsentRequired: string;
  title: string;
};

const COPY: Record<Lang, Strings> = {
  pl: {
    title: "Medale on-chain (opcjonalne)",
    optInRequired:
      "Aby otrzymywać medale on-chain, włącz opcję w ustawieniach profilu.",
    parentConsentRequired:
      "Konto poniżej 16 lat wymaga zgody rodzica na funkcję on-chain.",
    connectPromptTitle: "Połącz portfel, aby zobaczyć medale",
    connectPromptBody:
      "Zalecane: Coinbase Smart Wallet (logowanie przez Face ID / Touch ID — bez seedphrase).",
    mintableHeading: "Gotowe do mint",
    mintedHeading: "Moje medale on-chain",
    mintCta: "Zamintuj",
    minting: "Minting…",
    minted: "Zamintowany",
    burned: "Spalony (cofnięta zgoda)",
    viewOnExplorer: "Zobacz na BaseScan",
    noMedalsYet:
      "Nie masz jeszcze medali on-chain. Zamintuj pierwszy poniżej.",
    signatureRequestedTitle: "Proszę o podpis w portfelu",
    signatureRequestedBody:
      "To tylko podpis wiadomości — bez kosztów gazu. Potwierdza że portfel jest twój.",
    errorTitle: "Coś poszło nie tak",
  },
  en: {
    title: "On-chain medals (optional)",
    optInRequired:
      "To receive on-chain medals, enable the option in your profile settings.",
    parentConsentRequired:
      "Accounts under 16 need a parent's consent for the on-chain feature.",
    connectPromptTitle: "Connect a wallet to see your medals",
    connectPromptBody:
      "Recommended: Coinbase Smart Wallet (passkey sign-in — no seed phrase).",
    mintableHeading: "Ready to mint",
    mintedHeading: "My on-chain medals",
    mintCta: "Mint",
    minting: "Minting…",
    minted: "Minted",
    burned: "Burned (consent revoked)",
    viewOnExplorer: "View on BaseScan",
    noMedalsYet: "No on-chain medals yet. Mint your first below.",
    signatureRequestedTitle: "Please sign the request in your wallet",
    signatureRequestedBody:
      "Just a message signature — no gas cost. It proves the wallet is yours.",
    errorTitle: "Something went wrong",
  },
  uk: {
    title: "Медалі on-chain (опціонально)",
    optInRequired:
      "Щоб отримувати медалі on-chain, увімкни опцію у профілі.",
    parentConsentRequired:
      "Для акаунтів до 16 років потрібна згода батьків на функцію on-chain.",
    connectPromptTitle: "Підключи гаманець, щоб побачити медалі",
    connectPromptBody:
      "Рекомендовано: Coinbase Smart Wallet (вхід за відбитком — без seed-фрази).",
    mintableHeading: "Готові до mint",
    mintedHeading: "Мої медалі on-chain",
    mintCta: "Зробити mint",
    minting: "Mint…",
    minted: "Зроблено mint",
    burned: "Спалений (згоду відкликано)",
    viewOnExplorer: "Переглянути на BaseScan",
    noMedalsYet: "Ще немає медалей on-chain.",
    signatureRequestedTitle: "Підпиши запит у гаманці",
    signatureRequestedBody:
      "Це лише підпис повідомлення — без витрат на газ.",
    errorTitle: "Щось пішло не так",
  },
  cs: {
    title: "Medaile on-chain (volitelné)",
    optInRequired:
      "Aby sis mohl/a získávat medaile on-chain, zapni si to v nastavení profilu.",
    parentConsentRequired:
      "Účty mladší 16 let potřebují souhlas rodiče s funkcí on-chain.",
    connectPromptTitle: "Připoj peněženku, abys viděl/a medaile",
    connectPromptBody:
      "Doporučeno: Coinbase Smart Wallet (přihlášení přes Face ID / Touch ID).",
    mintableHeading: "K dispozici k mintu",
    mintedHeading: "Moje on-chain medaile",
    mintCta: "Mint",
    minting: "Minting…",
    minted: "Mintováno",
    burned: "Spálené (souhlas odvolán)",
    viewOnExplorer: "Zobrazit na BaseScan",
    noMedalsYet: "Zatím žádné on-chain medaile.",
    signatureRequestedTitle: "Podepiš žádost v peněžence",
    signatureRequestedBody:
      "Je to jen podpis zprávy — žádné poplatky za plyn.",
    errorTitle: "Něco se pokazilo",
  },
};

export async function Web3MedalGallerySection({
  username,
  lang,
}: {
  username: string;
  lang: Lang;
}) {
  const copy = COPY[lang];

  const [optIn, ageBucket, parentalConsent, owned] = await Promise.all([
    readWeb3OptIn(username),
    readAgeBucket(username),
    hasParentalConsent(username),
    ownedAchievements(username),
  ]);

  if (!optIn) {
    return (
      <section className="card p-4 flex flex-col gap-2 border-[var(--accent)]">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="text-sm text-zinc-400">{copy.optInRequired}</p>
      </section>
    );
  }

  const needsParent = ageBucket ? requiresParentalConsent(ageBucket) : true;
  if (needsParent && !parentalConsent) {
    return (
      <section className="card p-4 flex flex-col gap-2 border-[var(--accent)]">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="text-sm text-zinc-400">{copy.parentConsentRequired}</p>
      </section>
    );
  }

  // Build the pre-populated label + icon maps server-side so the
  // client component gets localized strings without importing the
  // full ACHIEVEMENT_DEFS bundle.
  const labels = {} as Record<AchievementId, string>;
  const icons = {} as Record<AchievementId, string>;
  for (const id of Object.keys(ACHIEVEMENT_DEFS) as AchievementId[]) {
    labels[id] = ACHIEVEMENT_DEFS[id].labels[lang];
    icons[id] = ACHIEVEMENT_DEFS[id].icon;
  }

  return (
    <Web3MedalGalleryLazy
      username={username}
      ownedAchievements={owned}
      achievementLabels={labels}
      achievementIcons={icons}
      strings={copy}
    />
  );
}
