import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';

/**
 * @Public() — marks a route or controller as publicly accessible.
 *
 * The global JwtAuthGuard reads this metadata and skips JWT validation
 * when it is present. Without this decorator, every route requires a
 * valid access token.
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 *
 *   @Public()
 *   @Controller('health')
 *   class HealthController { ... }  // entire controller is public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
