import { registerAs } from '@nestjs/config';
import { ACCESS_TOKEN_TTL_SECONDS } from '../constants/auth.constants';

/**
 * Auth configuration factory.
 * Loaded with ConfigModule.forFeature(authConfig) in AuthModule.
 * Accessed via ConfigService.get('auth.jwt.accessSecret'), etc.
 */
export const authConfig = registerAs('auth', () => ({
  jwt: {
    // Separate secrets for access/refresh allows independent rotation.
    // Falls back to JWT_SECRET for simpler single-secret setups.
    accessSecret:
      process.env.JWT_ACCESS_SECRET ??
      process.env.JWT_SECRET ??
      'access-secret-CHANGE-IN-PRODUCTION',
    accessExpiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s`,
  },
  cookie: {
    // true in production forces HTTPS-only cookie transmission
    secure: process.env.NODE_ENV === 'production',
    // 'strict' prevents CSRF; 'lax' allows same-site redirects in dev
    sameSite:
      process.env.NODE_ENV === 'production'
        ? ('none' as const)
        : ('lax' as const),
    // Set to your domain in production (e.g. 'example.com')
    domain: process.env.COOKIE_DOMAIN ?? undefined,
  },
}));
