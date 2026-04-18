/* 10 pre-made avatars — emoji-only (no external assets to ship). Kids pick
 * one at signup or from profile settings. Picking avatar-0 = deliberately
 * no avatar (blank tile). */

export type AvatarId =
  | "av-0"
  | "av-1"
  | "av-2"
  | "av-3"
  | "av-4"
  | "av-5"
  | "av-6"
  | "av-7"
  | "av-8"
  | "av-9";

export const AVATARS: { id: AvatarId; emoji: string; hue: string }[] = [
  { id: "av-0", emoji: "👤", hue: "#64748b" },
  { id: "av-1", emoji: "🦊", hue: "#f97316" },
  { id: "av-2", emoji: "🐻", hue: "#92400e" },
  { id: "av-3", emoji: "🦉", hue: "#854d0e" },
  { id: "av-4", emoji: "🐙", hue: "#ec4899" },
  { id: "av-5", emoji: "🐸", hue: "#16a34a" },
  { id: "av-6", emoji: "🦄", hue: "#a855f7" },
  { id: "av-7", emoji: "🐼", hue: "#334155" },
  { id: "av-8", emoji: "🦁", hue: "#eab308" },
  { id: "av-9", emoji: "🐬", hue: "#0ea5e9" },
];

export function avatarFor(id: string | undefined): typeof AVATARS[number] {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
