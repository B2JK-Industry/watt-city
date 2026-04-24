"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";

type T = Dict["dashboard"];

export function DeleteAccountButton({ t }: { t: T }) {
  const [stage, setStage] = useState<"idle" | "confirm" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  if (stage === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStage("confirm")}
        className="btn btn-danger text-xs"
      >
        {t.deleteAccount}
      </button>
    );
  }

  if (stage === "confirm") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[var(--ink-muted)] max-w-xs">
          {t.deleteAccountWarn}{" "}
          <strong>{t.deleteAccountIrreversible}</strong>
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
                  setError(body.error ?? t.deleteAccountFailed);
                  setStage("confirm");
                  return;
                }
                window.location.href = "/";
              } catch {
                setError(t.deleteAccountNetworkError);
                setStage("confirm");
              }
            }}
            className="btn btn-danger text-xs"
          >
            {t.deleteAccountConfirm}
          </button>
          <button
            type="button"
            onClick={() => setStage("idle")}
            className="btn btn-ghost text-xs"
          >
            {t.deleteAccountCancel}
          </button>
        </div>
        {error && <p className="text-[var(--danger)] text-xs">{error}</p>}
      </div>
    );
  }

  return <span className="text-xs text-[var(--ink-muted)]">{t.deleteAccountDeleting}</span>;
}
