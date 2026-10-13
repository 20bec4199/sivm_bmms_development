// ─── Strategy Names ──────────────────────────────────────────────────────────
export const JWT_ACCESS_STRATEGY = 'jwt';
export const LOCAL_STRATEGY = 'local';

// ─── Cookie Names ────────────────────────────────────────────────────────────
export const COOKIE_ACCESS_TOKEN = 'access_token';
export const COOKIE_REFRESH_TOKEN = 'refresh_token';

// ─── Metadata Keys ───────────────────────────────────────────────────────────
// Used by @Public() decorator to skip the global JwtAuthGuard
export const IS_PUBLIC_KEY = 'isPublic';
// Used by @Roles() decorator to attach required roles to a route
export const ROLES_KEY = 'roles';

// ─── Time Constants ───────────────────────────────────────────────────────────
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;           // 15 minutes
export const REFRESH_TOKEN_TTL_DAYS = 7;                    // 7 days
export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;          // 15 minutes
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;    // 24 hours

// ─── Security Constants ───────────────────────────────────────────────────────
// Number of previous passwords to check when changing password
export const PASSWORD_HISTORY_LIMIT = 5;

// Progressive lock thresholds: { attempts, durationMs }
// durationMs = null means permanent lock (requires admin unlock)
export const LOCK_THRESHOLDS: ReadonlyArray<{
  attempts: number;
  durationMs: number | null;
}> = [
  { attempts: 3, durationMs: 5 * 60 * 1000 },           // 3 fails  → 5 min lock
  { attempts: 5, durationMs: 30 * 60 * 1000 },           // 5 fails  → 30 min lock
  { attempts: 10, durationMs: 24 * 60 * 60 * 1000 },     // 10 fails → 24 hr lock
  { attempts: 20, durationMs: null },                     // 20 fails → permanent lock
];
