import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LOCAL_STRATEGY } from '../constants/auth.constants';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';
import { AuthService } from '../auth.service';

/**
 * LocalStrategy — validates email + password credentials at login.
 *
 * passport-local reads `req.body.username` and `req.body.password` by default.
 * We configure `usernameField: 'email'` so it reads `req.body.email` instead.
 *
 * Flow:
 *  1. LocalAuthGuard activates this strategy on POST /auth/login
 *  2. Strategy calls validate(email, password)
 *  3. AuthService.validateCredentials() checks credentials and lock status
 *  4. On success: Passport attaches the returned user to req.user
 *  5. On failure: throws InvalidCredentialsException (401)
 *  6. Controller reads req.user and calls authService.login() to create the session
 *
 * Note: The login body (email, password) is NOT validated by a DTO pipe here —
 * passport-local reads from req.body directly before pipes run. Basic type safety
 * is covered by class-validator on the service level.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, LOCAL_STRATEGY) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * Called by Passport with the extracted credentials.
   * Must return the user object or throw — never return null/false
   * (Passport interprets null/false as 401 with no error detail).
   */
  validate(email: string, password: string): Promise<AuthenticatedUser> {
    return this.authService.validateCredentials(email, password);
  }
}
