/**
 * インメモリ レート制限
 * MVP向けの簡易実装。スケールアウト時はRedis等に移行。
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 定期的に期限切れエントリを削除（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

interface RateLimitConfig {
  /** 識別キー（IPやユーザーID） */
  key: string;
  /** ウィンドウ期間（ミリ秒） */
  windowMs: number;
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { key, windowMs, maxRequests } = config;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新しいウィンドウを開始
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/** レート制限プリセット */
export const RATE_LIMITS = {
  /** API全体: 100リクエスト/分/IP */
  API_GENERAL: { windowMs: 60_000, maxRequests: 100 },
  /** 認証系: 5リクエスト/分/IP */
  AUTH: { windowMs: 60_000, maxRequests: 5 },
  /** 対戦募集: 3件/時間/ユーザー */
  MATCH_REQUEST: { windowMs: 3_600_000, maxRequests: 3 },
} as const;
