"use client";

import { useState } from "react";

export function DeleteAccountButton() {
  const [stage, setStage] = useState<"idle" | "confirm" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  if (stage === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStage("confirm")}
        className="btn btn-danger text-xs"
      >
        Zmazať účet
      </button>
    );
  }

  if (stage === "confirm") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-300 max-w-xs">
          Toto vymaže tvoj účet, Watty, medaile a všetky záznamy v rebríčkoch.{" "}
          <strong>Nedá sa vrátiť.</strong>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              setStage("deleting");
              setError(null);
              try {
                const res = await fetch("/api/me", { method: "DELETE" });
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  setError(body.error ?? "Nepodarilo sa zmazať účet.");
                  setStage("confirm");
                  return;
                }
                window.location.href = "/";
              } catch {
                setError("Sieťová chyba.");
                setStage("confirm");
              }
            }}
            className="btn btn-danger text-xs"
          >
            Áno, zmazať
          </button>
          <button
            type="button"
            onClick={() => setStage("idle")}
            className="btn btn-ghost text-xs"
          >
            Zrušiť
          </button>
        </div>
        {error && <p className="text-rose-400 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <span className="text-xs text-zinc-400">Mažem účet…</span>
  );
}
