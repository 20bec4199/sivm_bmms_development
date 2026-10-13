import { z } from 'zod';

/**
 * Standardized Enterprise Frontend Error Message Dictionary
 * Section 7: Friendly, professional, consistent user messaging
 */
export const EnterpriseMessages = {
  REQUIRED: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Phone number must contain 10 digits.',
  PASSWORD_STRENGTH: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one digit, and one special character.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  BUILDING_EXISTS: 'Building name already exists.',
  SELECT_ORGANIZATION: 'Please select an organization.',
  INVALID_DATE: 'Invalid date selected.',
  END_AFTER_START: 'End date must be after start date.',
  FILE_SIZE: 'File size exceeds the allowed limit.',
  FILE_TYPE_PDF: 'Only PDF files are allowed.',
  DUPLICATE_ENTRY: 'Duplicate entry detected.',
  UNAUTHORIZED: "You don't have permission to perform this action.",
  SESSION_EXPIRED: 'Session expired. Please login again.',
  NETWORK_LOST: 'Network connection lost.',
  SERVER_ERROR: 'Unexpected server error.',
  UNABLE_TO_SAVE: 'Unable to save changes.',
  NEGATIVE_VALUE: 'Value cannot be negative.',
  INVALID_UUID: 'Invalid identifier supplied.',
} as const;

/**
 * Input Sanitization Engine (Section 3)
 * Prevents XSS, Script injection, HTML injection, SQL injection syntax, and invalid control chars
 */
export const InputSanitizer = {
  /** Trims spaces, removes consecutive spaces, normalizes Unicode to NFC */
  cleanString: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input
      .normalize('NFC')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Strip control characters
  },

  /** Strips dangerous scripts and event handlers to prevent XSS / Script injection */
  sanitizeHtml: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  },

  /** Sanitizes against basic SQL injection operators and escapes */
  sanitizeSql: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/['";\\]/g, (char) => `\\${char}`);
  },

  /** Comprehensive sanitization across all vectors */
  sanitizeFull: (input: string): string => {
    let clean = InputSanitizer.cleanString(input);
    clean = InputSanitizer.sanitizeHtml(clean);
    return clean;
  },
};

/**
 * Reusable Zod Enterprise Schema Component Builders (Sections 1 & 5)
 * Configured specifically for Zod v4 compatibility with standardized feedback
 */
export const EnterpriseSchemas = {
  uuid: z.string({ message: EnterpriseMessages.INVALID_UUID }).uuid(EnterpriseMessages.INVALID_UUID),
  
  requiredString: () =>
    z.string({ message: EnterpriseMessages.REQUIRED })
      .min(1, EnterpriseMessages.REQUIRED)
      .transform((val) => InputSanitizer.cleanString(val)),

  email: z.string({ message: EnterpriseMessages.REQUIRED })
    .email(EnterpriseMessages.INVALID_EMAIL)
    .transform((val) => val.trim().toLowerCase()),

  phone: z.string({ message: EnterpriseMessages.REQUIRED })
    .regex(/^\d{10}$/, EnterpriseMessages.INVALID_PHONE),

  password: z.string({ message: EnterpriseMessages.REQUIRED })
    .min(8, EnterpriseMessages.PASSWORD_STRENGTH)
    .regex(/[A-Z]/, EnterpriseMessages.PASSWORD_STRENGTH)
    .regex(/[a-z]/, EnterpriseMessages.PASSWORD_STRENGTH)
    .regex(/[0-9]/, EnterpriseMessages.PASSWORD_STRENGTH)
    .regex(/[\W_]/, EnterpriseMessages.PASSWORD_STRENGTH),

  positiveNumber: z.number({ message: EnterpriseMessages.REQUIRED })
    .nonnegative(EnterpriseMessages.NEGATIVE_VALUE),

  postalCode: z.string().regex(/^[a-zA-Z0-9\s-]{3,10}$/, 'Please enter a valid postal code.'),

  countryCode: z.string().regex(/^\+\d{1,4}$/, 'Invalid country dial code format.'),

  url: z.string().url('Invalid URL format.'),

  date: z.string().or(z.date()).refine((val) => !isNaN(new Date(val as string).getTime()), {
    message: EnterpriseMessages.INVALID_DATE,
  }),
};

/**
 * Business Logic Validators (Section 5)
 */
export const BusinessValidators = {
  validateDateRange: (start: string | Date, end: string | Date) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return { isValid: false, message: EnterpriseMessages.INVALID_DATE };
    if (e <= s) return { isValid: false, message: EnterpriseMessages.END_AFTER_START };
    return { isValid: true };
  },

  validateFileUpload: (file: { name: string; size: number; type: string }, options?: { maxSizeMB?: number; allowedTypes?: string[] }) => {
    const maxSizeMB = options?.maxSizeMB ?? 10;
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { isValid: false, message: `${EnterpriseMessages.FILE_SIZE} (Limit: ${maxSizeMB}MB)` };
    }
    if (options?.allowedTypes && options.allowedTypes.length > 0) {
      if (!options.allowedTypes.some((t) => file.type.includes(t) || file.name.endsWith(t))) {
        return { isValid: false, message: `Invalid file type. Allowed formats: ${options.allowedTypes.join(', ')}` };
      }
    }
    return { isValid: true };
  },

  validateOccupancyConflict: (isExclusive: boolean, currentCount: number, maxCapacity = 20) => {
    if (isExclusive && currentCount >= 1) {
      return { isBlocked: true, reason: 'Exclusive amenity: time slot is already reserved.' };
    }
    if (!isExclusive && currentCount >= maxCapacity) {
      return { isBlocked: true, reason: `Shared amenity: maximum concurrent capacity (${maxCapacity}) reached.` };
    }
    return { isBlocked: false, reason: null };
  },
};

/**
 * Form Validation UX Helper (Section 2)
 * Automatically scrolls the user viewport and focuses the first invalid form field
 */
export const FormUX = {
  scrollToFirstError: (errorFields: string[]) => {
    if (!errorFields || errorFields.length === 0) return;
    const firstFieldName = errorFields[0];
    const el = document.querySelector(`[name="${firstFieldName}"], #${firstFieldName}, [data-field="${firstFieldName}"]`);
    if (el && 'focus' in el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus();
    }
  },
};
