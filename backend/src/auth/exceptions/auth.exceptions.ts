import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

// ─── Credential & Lock Exceptions ────────────────────────────────────────────

/**
 * Thrown for invalid email or password.
 * Deliberately generic — never reveal WHICH field was wrong (prevents enumeration).
 */
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({ message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
  }
}

/**
 * Thrown when the account is temporarily locked due to failed attempts.
 * Includes the unlock time so the client can show a countdown.
 */
export class AccountLockedTemporaryException extends UnauthorizedException {
  constructor(until: Date) {
    super({
      message: `Account locked until ${until.toISOString()}. Try again later.`,
      code: 'ACCOUNT_LOCKED_TEMPORARY',
      lockedUntil: until.toISOString(),
    });
  }
}

/**
 * Thrown after too many failed attempts.
 * Requires manual admin intervention to unlock.
 */
export class AccountLockedPermanentException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Account permanently locked. Contact support.',
      code: 'ACCOUNT_LOCKED_PERMANENT',
    });
  }
}

/** Thrown when a user's account has been deactivated by an admin */
export class AccountInactiveException extends UnauthorizedException {
  constructor() {
    super({ message: 'Account is deactivated.', code: 'ACCOUNT_INACTIVE' });
  }
}

// ─── Token Exceptions ────────────────────────────────────────────────────────

/**
 * Generic invalid / expired token error.
 * Used for reset tokens, email verification tokens, etc.
 */
export class InvalidTokenException extends UnauthorizedException {
  constructor(message = 'Invalid or expired token.') {
    super({ message, code: 'INVALID_TOKEN' });
  }
}

/**
 * Thrown when a refresh token that was already rotated (USED status) is
 * presented again. This indicates theft. All sessions in the token family
 * are immediately terminated.
 */
export class TokenReuseException extends UnauthorizedException {
  constructor() {
    super({
      message:
        'Security alert: token reuse detected. All sessions have been terminated.',
      code: 'TOKEN_REUSE_DETECTED',
    });
  }
}

// ─── Registration / Password Exceptions ──────────────────────────────────────

/** Thrown when a registration attempt uses an already registered email */
export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super({ message: 'Email address is already registered.', code: 'EMAIL_EXISTS' });
  }
}

/** Thrown when the current password provided during a change is wrong */
export class InvalidCurrentPasswordException extends BadRequestException {
  constructor() {
    super({
      message: 'Current password is incorrect.',
      code: 'INVALID_CURRENT_PASSWORD',
    });
  }
}

/**
 * Thrown when the new password matches one of the last N stored hashes.
 * Enforces password history policy (default: last 5 passwords).
 */
export class PasswordReusedException extends BadRequestException {
  constructor() {
    super({
      message: 'This password was recently used. Choose a different one.',
      code: 'PASSWORD_REUSED',
    });
  }
}

/** Thrown on endpoints that require email verification before access */
export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super({
      message: 'Email address has not been verified.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
}
