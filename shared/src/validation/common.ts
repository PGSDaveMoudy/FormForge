import { z } from 'zod';
import { VALIDATION_CONSTANTS } from '../constants';

export const idSchema = z.string().uuid('Invalid ID format');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH, 'Email too long');

export const passwordSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH, 'Password too short')
  .max(VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');

export const nameSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Name too short')
  .max(VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Name too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const urlSchema = z.string().url('Invalid URL format');

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long');

export const postalCodeSchema = z
  .string()
  .regex(/^[\d\w\s\-]+$/, 'Invalid postal code format')
  .max(10, 'Postal code too long');