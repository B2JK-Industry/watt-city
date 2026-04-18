import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { kvGet, kvSetNX, kvSet } from "@/lib/redis";

export type UserRecord = {
  username: string;
  passwordHash: string; // scrypt: salt:hash (hex)
  createdAt: number;
};

const USER_PREFIX = "xp:user:";
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return "Používateľské meno musí mať 3–24 znakov (písmená, čísla, _ . -).";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (typeof password !== "string" || password.length < 6) {
    return "Heslo musí mať aspoň 6 znakov.";
  }
  if (password.length > 200) {
    return "Heslo je príliš dlhé.";
  }
  return null;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function getUser(username: string): Promise<UserRecord | null> {
  return await kvGet<UserRecord>(`${USER_PREFIX}${normalizeUsername(username)}`);
}

export async function registerUser(
  rawUsername: string,
  rawPassword: string,
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const username = normalizeUsername(rawUsername);
  const usernameError = validateUsername(username);
  if (usernameError) return { ok: false, error: usernameError };
  const passwordError = validatePassword(rawPassword);
  if (passwordError) return { ok: false, error: passwordError };

  const record: UserRecord = {
    username,
    passwordHash: hashPassword(rawPassword),
    createdAt: Date.now(),
  };
  const claimed = await kvSetNX(`${USER_PREFIX}${username}`, record);
  if (!claimed) {
    return { ok: false, error: "Toto používateľské meno je už obsadené." };
  }
  return { ok: true, user: record };
}

export async function loginUser(
  rawUsername: string,
  rawPassword: string,
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const username = normalizeUsername(rawUsername);
  const user = await getUser(username);
  if (!user) {
    return { ok: false, error: "Nesprávne meno alebo heslo." };
  }
  if (!verifyPassword(rawPassword, user.passwordHash)) {
    return { ok: false, error: "Nesprávne meno alebo heslo." };
  }
  return { ok: true, user };
}

export async function touchUser(user: UserRecord): Promise<void> {
  await kvSet(`${USER_PREFIX}${user.username}`, user);
}
