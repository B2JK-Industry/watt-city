export const dynamic = "force-dynamic";

// Parent-facing landing when they click the magic link. Plain text in
// PL-first for MVP; the real PKO-skin version (Phase 4.3) will add
// legal copy via PRIVACY-PKO.md §3.3.
//
// The page itself does NOT auto-grant — the parent must click "Confirm"
// to POST. This stops aggressive email preview services (Outlook, iOS
// Mail) from pre-fetching the link and accidentally granting consent.
import { ConsentClient } from "@/components/consent-client";

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="flex flex-col gap-6 animate-slide-up max-w-2xl">
      <header className="flex flex-col gap-2">
        <h1 className="section-heading text-3xl">Zgoda rodzica</h1>
        <p className="text-sm text-zinc-400">
          Twoje dziecko zarejestrowało się w Watt City — grze edukacyjnej
          uczącej finansów osobistych. Potwierdź, że wyrażasz zgodę na
          założenie konta. Możesz ją cofnąć w dowolnym momencie, pisząc na
          adres dpo@watt-city.example.
        </p>
        <p className="text-xs text-amber-400">
          ⚠️ GRA EDUKACYJNA — brak prawdziwych pieniędzy. Brak zewnętrznych
          trackerów. Przechowujemy tylko: nazwę użytkownika, zahaszowane
          hasło, rok urodzenia dziecka, ten adres e-mail rodzica.
        </p>
      </header>
      <ConsentClient token={token} />
    </div>
  );
}
