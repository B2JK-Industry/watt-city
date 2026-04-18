export type ScoreSuccess = {
  ok: true;
  awarded: number;
  globalXP: number;
  gameXP: number;
  globalRank: number | null;
  level: {
    level: number;
    xpIntoLevel: number;
    xpForLevel: number;
    xpToNext: number;
    progress: number;
  };
  gameStats: {
    plays: number;
    bestScore: number;
    totalScore: number;
    lastPlayedAt: number;
  };
  isNewBest: boolean;
  previousBest: number;
  delta: number;
};

export type ScoreFailure = { ok: false; error: string };

export type ScoreResponse = ScoreSuccess | ScoreFailure;

// Phase 6.1.4 — read the CSRF cookie (set by middleware) and echo it in
// the X-CSRF-Token header on every mutating request. Cookies are readable
// by JS on purpose — the protection comes from same-origin scripts being
// the only code that can read document.cookie.
function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)wc_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

type FetchInit = Omit<RequestInit, "body"> & { body?: unknown };

/** Fetch wrapper that auto-JSON-stringifies + attaches the CSRF header.
 *  Use for every client → server mutating call. Returns the parsed JSON
 *  response (or `{ ok: false, error }` on network/parse failure). */
export async function postJson<T = unknown>(
  path: string,
  body?: unknown,
  init: FetchInit = {},
): Promise<T | { ok: false; error: string }> {
  const token = csrfToken();
  try {
    const res = await fetch(path, {
      ...init,
      method: init.method ?? "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { "x-csrf-token": token } : {}),
        ...(init.headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function submitScore(
  gameId: string,
  xp: number,
): Promise<ScoreResponse> {
  const json = await postJson<ScoreSuccess | ScoreFailure>("/api/score", {
    gameId,
    xp: Math.max(0, Math.floor(xp)),
  });
  if (!("ok" in json) || !json.ok) {
    return {
      ok: false,
      error: ("error" in json && json.error) || "Błąd serwera.",
    };
  }
  return json as ScoreSuccess;
}
