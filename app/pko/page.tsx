import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { getPlayerState } from "@/lib/player";
import {
  getAccount,
  auditLog,
} from "@/lib/pko-junior-mock";
import { PkoMirrorClient } from "@/components/pko-mirror-client";

export const dynamic = "force-dynamic";

export default async function PkoJuniorPage() {
  const [session, lang] = await Promise.all([getSession(), getLang()]);
  if (!session) redirect("/login");
  const [state, account, audit] = await Promise.all([
    getPlayerState(session.username),
    getAccount(session.username),
    auditLog(session.username, 50),
  ]);

  const copy = {
    pl: {
      heading: "PKO Junior × Watt City (mock)",
      subtitle:
        "To wersja MOCK prawdziwej integracji. Nic tutaj nie wymienia się na prawdziwe pieniądze — służy do pokazu partnerskiego pitch.",
      createAccount: "Utwórz konto PKO Junior (mock)",
      childName: "Imię dziecka",
      create: "Utwórz",
      balance: "Saldo PKO Junior (mock)",
      mirror: "Mirror z Watt City",
      mirrorHint: "Weź wybrany % Watt-City cashflow i dodaj do mock PKO Junior.",
      topup: "Top-up ręczny (mock)",
      amount: "Kwota (PLN)",
      apply: "Wykonaj",
      history: "Historia operacji (audit log)",
      empty: "Brak ruchów.",
      warn:
        "⚠️ MOCK — to nie są prawdziwe pieniądze. Prawdziwa integracja wymaga umowy z PKO (Phase 4.2.4, BLOCKED).",
    },
    uk: {
      heading: "PKO Junior × Watt City (мок)",
      subtitle: "Мок версія, без реальних коштів.",
      createAccount: "Створити мок-акаунт",
      childName: "Ім'я дитини",
      create: "Створити",
      balance: "Баланс",
      mirror: "Mirror із Watt City",
      mirrorHint: "Мок mirror — прозорий відбиток балансу у грі.",
      topup: "Поповнення (мок)",
      amount: "Сума (PLN)",
      apply: "Виконати",
      history: "Історія",
      empty: "Порожньо.",
      warn: "⚠️ МОК — не справжні гроші.",
    },
    cs: {
      heading: "PKO Junior × Watt City (mock)",
      subtitle: "Mock, žádné skutečné peníze.",
      createAccount: "Vytvořit mock účet",
      childName: "Jméno dítěte",
      create: "Vytvořit",
      balance: "Zůstatek",
      mirror: "Mirror z Watt City",
      mirrorHint: "Mock mirror — odraz in-game zůstatku.",
      topup: "Top-up (mock)",
      amount: "Částka (PLN)",
      apply: "Provést",
      history: "Historie",
      empty: "Prázdné.",
      warn: "⚠️ MOCK — nejsou to skutečné peníze.",
    },
    en: {
      heading: "PKO Junior × Watt City (mock)",
      subtitle:
        "This is the MOCK side of a future real integration. Nothing here touches real money; it exists so partnership demos look like the real thing.",
      createAccount: "Create mock PKO Junior account",
      childName: "Child's name",
      create: "Create",
      balance: "PKO Junior balance (mock)",
      mirror: "Mirror from Watt City",
      mirrorHint:
        "Take a chosen % of your in-game cashflow and mirror into the mock PKO Junior account.",
      topup: "Manual top-up (mock)",
      amount: "Amount (PLN)",
      apply: "Run",
      history: "Operation history (audit log)",
      empty: "No transactions yet.",
      warn:
        "⚠️ MOCK — not real money. Real integration requires a PKO agreement (Phase 4.2.4, BLOCKED).",
    },
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <header className="flex flex-col gap-2">
        <h1 className="brutal-heading text-3xl">{copy.heading}</h1>
        <p className="text-sm text-zinc-400">{copy.subtitle}</p>
        <p className="text-xs uppercase tracking-wider text-amber-400">
          {copy.warn}
        </p>
      </header>
      <PkoMirrorClient
        initialAccount={account}
        initialAudit={audit}
        wattCityCashZl={state.resources.cashZl ?? 0}
        copy={copy}
      />
    </div>
  );
}
