export const API_ROUTES = {
  AUTH: '/api/auth',
  FORMS: '/api/forms',
  SALESFORCE: '/api/salesforce',
  EMAIL: '/api/email',
  SIGNATURE: '/api/signature',
  SUBMISSIONS: '/api/submissions',
  ORGANIZATIONS: '/api/organizations'
} as const;

export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_URL: 'DATABASE_URL',
  REDIS_URL: 'REDIS_URL',
  JWT_SECRET: 'JWT_SECRET',
  JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',
  SENDGRID_API_KEY: 'SENDGRID_API_KEY',
  FROM_EMAIL: 'FROM_EMAIL',
  SALESFORCE_CLIENT_ID: 'SALESFORCE_CLIENT_ID',
  SALESFORCE_CLIENT_SECRET: 'SALESFORCE_CLIENT_SECRET',
  SALESFORCE_CALLBACK_URL: 'SALESFORCE_CALLBACK_URL',
  FRONTEND_URL: 'FRONTEND_URL',
  BACKEND_URL: 'BACKEND_URL'
} as const;

export const VALIDATION_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 255,
  MAX_FORM_NAME_LENGTH: 100,
  MAX_FORM_DESCRIPTION_LENGTH: 500,
  MAX_ELEMENT_LABEL_LENGTH: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
} as const;

export const CANVAS_CONSTANTS = {
  GRID_SIZE: 10,
  MIN_ELEMENT_WIDTH: 100,
  MIN_ELEMENT_HEIGHT: 40,
  MAX_ELEMENT_WIDTH: 800,
  MAX_ELEMENT_HEIGHT: 400,
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,
  SNAP_THRESHOLD: 5
} as const;

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  EMAIL_VERIFICATION_ATTEMPTS: 3,
  FORM_SUBMISSIONS_PER_HOUR: 100,
  API_REQUESTS_PER_MINUTE: 60
} as const;