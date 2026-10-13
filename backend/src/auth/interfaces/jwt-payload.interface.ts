/**
 * Shape of the JWT access token payload.
 *
 * Kept intentionally small to minimise token size (every request carries it).
 * No PII (email, name) — look those up from cache/DB when needed.
 */
export interface JwtPayload {
  /** Subject — the user's UUID */
  sub: string;

  /** Session ID — used for per-session revocation without a denylist scan */
  sid: string;

  /** Organisation UUID — for multi-tenant query scoping */
  organizationId: string;

  /** Coarse-grained RBAC roles (e.g. ['ADMIN', 'RESIDENT']) */
  roles: string[];

  // Permissions removed from JWT payload to prevent 431 Header too large errors.
  // They are re-fetched from the database in JwtStrategy.

  /** Unique token ID — reserved for a future Redis denylist */
  jti: string;

  /** Issued-at timestamp (set automatically by @nestjs/jwt) */
  iat?: number;

  /** Expiry timestamp (set automatically by @nestjs/jwt) */
  exp?: number;
}
