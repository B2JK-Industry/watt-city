import Link from "next/link";
import { DemoStartButton } from "./demo-start-button";
import { DEMO_TEACHER_USERNAME, DEMO_CLASS_NAME } from "@/lib/demo-seed";

/* D4 — demo-start landing. Visitor arrives from /dla-szkol → clicks
 * "Rozpocznij demo". <DemoStartButton> is a client component that
 * POSTs /api/dla-szkol/demo/start and redirects on success. */

export const metadata = {
  title: "Watt City demo · 1 klik",
  description:
    "Wypróbuj Watt City jako nauczyciel. Demo-klasa z 30 uczniami i tygodniem aktywności, bez rejestracji.",
};

export default function DemoStartPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-slide-up">
      <section className="flex flex-col gap-3">
        <p className="text-xs opacity-70">
          🎬 Demo dla partnera / dyrekcji
        </p>
        <h1 className="section-heading text-3xl sm:text-4xl">
          Zaloguj się jako nauczyciel demo — 1 klik
        </h1>
        <p className="text-base text-zinc-300 leading-relaxed">
          Po kliknięciu utworzymy sesję konta <code className="font-mono text-[var(--accent)]">
            {DEMO_TEACHER_USERNAME}
          </code>{" "}
          i przeniesiemy Cię do dashboardu <strong>{DEMO_CLASS_NAME}</strong> — klasa 7,
          30 uczniów, 4 tygodnie aktywności, pobierz raport PDF, sprawdź
          pokrycie podstawy programowej. Bez rejestracji, bez e-maila.
        </p>
      </section>

      <DemoStartButton />

      <section className="card p-4 flex flex-col gap-2 text-sm">
        <h2 className="text-xs font-semibold text-[var(--accent)]">
          Co zobaczysz
        </h2>
        <ul className="flex flex-col gap-1.5 list-disc list-inside opacity-80">
          <li>Dashboard klasy z top 10 uczniami w rankingu</li>
          <li>Tygodniowy temat + wykres pokrycia podstawy programowej</li>
          <li>Picker tematów alignowany z MEN V–VIII</li>
          <li>Raport PDF do dziennika — jeden klik</li>
          <li>Panel ucznia (miasto, cashflow, pożyczki) — udaj ucznia</li>
        </ul>
      </section>

      <section className="card p-4 flex flex-col gap-2 text-xs opacity-80">
        <h2 className="text-[10px] font-semibold">
          ⚠️ Tryb demo
        </h2>
        <p>
          Dane tego konta są współdzielone z innymi odwiedzającymi demo.
          Zmiany, które wprowadzisz (np. temat tygodnia), są widoczne dla
          wszystkich. Dla bezpiecznego własnego konta:{" "}
          <Link
            href="/nauczyciel/signup"
            className="underline text-[var(--accent)]"
          >
            zarejestruj się jako nauczyciel
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
