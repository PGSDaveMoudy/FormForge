import { z } from 'zod';
import { idSchema } from './common';
import { ElementType, SubmissionStatus } from '../types';
import { VALIDATION_CONSTANTS, CANVAS_CONSTANTS } from '../constants';

const elementPositionSchema = z.object({
  x: z.number().int().min(0).max(CANVAS_CONSTANTS.CANVAS_WIDTH),
  y: z.number().int().min(0).max(CANVAS_CONSTANTS.CANVAS_HEIGHT),
  width: z.number().int().min(CANVAS_CONSTANTS.MIN_ELEMENT_WIDTH).max(CANVAS_CONSTANTS.MAX_ELEMENT_WIDTH),
  height: z.number().int().min(CANVAS_CONSTANTS.MIN_ELEMENT_HEIGHT).max(CANVAS_CONSTANTS.MAX_ELEMENT_HEIGHT),
  zIndex: z.number().int().min(0).max(1000)
});

const elementValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  fileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().int().min(1).max(VALIDATION_CONSTANTS.MAX_FILE_SIZE).optional()
});

const elementPropertiesSchema = z.object({
  label: z.string().min(1).max(VALIDATION_CONSTANTS.MAX_ELEMENT_LABEL_LENGTH),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
  options: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1)
  })).optional(),
  validation: elementValidationSchema.optional(),
  readonly: z.boolean().optional(),
  hidden: z.boolean().optional()
});

export const formElementSchema = z.object({
  id: idSchema,
  type: z.nativeEnum(ElementType),
  position: elementPositionSchema,
  properties: elementPropertiesSchema
});

export const createFormElementSchema = formElementSchema.omit({ id: true });

export const updateFormElementSchema = formElementSchema.partial().extend({
  id: idSchema
});

const formSettingsSchema = z.object({
  submitRedirectUrl: z.string().url().optional(),
  emailNotifications: z.array(z.string().email()).optional(),
  salesforceIntegration: z.object({
    enabled: z.boolean(),
    objectType: z.string(),
    fieldMappings: z.record(z.string(), z.string())
  }).optional(),
  allowDuplicateSubmissions: z.boolean().default(true),
  requireAuthentication: z.boolean().default(false)
});

export const createFormSchema = z.object({
  name: z.string().min(1).max(VALIDATION_CONSTANTS.MAX_FORM_NAME_LENGTH),
  description: z.string().max(VALIDATION_CONSTANTS.MAX_FORM_DESCRIPTION_LENGTH).optional(),
  elements: z.array(createFormElementSchema).default([]),
  settings: formSettingsSchema.default({
    allowDuplicateSubmissions: true,
    requireAuthentication: false
  })
});

export const updateFormSchema = createFormSchema.partial().extend({
  id: idSchema
});

export const duplicateFormSchema = z.object({
  name: z.string().min(1).max(VALIDATION_CONSTANTS.MAX_FORM_NAME_LENGTH)
});

export const formSubmissionSchema = z.object({
  formId: idSchema,
  data: z.record(z.string(), z.any()),
  submittedBy: idSchema.optional()
});

export const updateSubmissionStatusSchema = z.object({
  status: z.nativeEnum(SubmissionStatus)
});