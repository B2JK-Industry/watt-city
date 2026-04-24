"use client";

import { useState } from "react";
import { AVATARS } from "@/lib/avatars";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  initialAvatar?: string;
  initialDisplayName?: string;
};

export function ProfileEdit({
  lang,
  initialAvatar,
  initialDisplayName,
}: Props) {
  const [avatar, setAvatar] = useState(initialAvatar ?? "av-0");
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar,
          displayName: displayName.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!j.ok) setError(j.error ?? "error");
      else setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const copy = {
    pl: { avatar: "Awatar", name: "Nazwa wyświetlana", save: "Zapisz", saved: "Zapisano ✓", placeholder: "np. Daniel z Katowic" },
    uk: { avatar: "Аватар", name: "Відображуване ім'я", save: "Зберегти", saved: "Збережено ✓", placeholder: "напр. Данило з Катовиць" },
    cs: { avatar: "Avatar", name: "Zobrazované jméno", save: "Uložit", saved: "Uloženo ✓", placeholder: "např. Daniel z Katovic" },
    en: { avatar: "Avatar", name: "Display name", save: "Save", saved: "Saved ✓", placeholder: "e.g. Daniel from Katowice" },
  }[lang];

  return (
    <div className="card p-4 flex flex-col gap-4">
      <div>
        <p className="text-xs text-zinc-400 mb-2">{copy.avatar}</p>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {AVATARS.map((a) => {
            const selected = avatar === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAvatar(a.id)}
                className={
                  "aspect-square text-2xl rounded border transition " +
                  (selected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--ink)]/30 hover:border-[var(--ink)]")
                }
                style={{ color: selected ? a.hue : undefined }}
                aria-label={a.id}
              >
                {a.emoji}
              </button>
            );
          })}
        </div>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span>{copy.name}</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={copy.placeholder}
          maxLength={32}
          className="px-3 py-2 border border-[var(--ink)] rounded bg-[var(--surface-2)]"
        />
      </label>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {copy.save}
        </button>
        {saved && <span className="text-emerald-400 text-sm">{copy.saved}</span>}
        {error && <span className="text-rose-400 text-sm">{error}</span>}
      </div>
    </div>
  );
}
