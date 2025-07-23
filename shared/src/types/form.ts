export enum ElementType {
  TEXT_INPUT = 'text_input',
  NUMBER_INPUT = 'number_input',
  EMAIL_INPUT = 'email_input',
  TEXTAREA = 'textarea',
  PICKLIST = 'picklist',
  MULTI_PICKLIST = 'multi_picklist',
  DATE_PICKER = 'date_picker',
  CHECKBOX = 'checkbox',
  RADIO_GROUP = 'radio_group',
  FILE_UPLOAD = 'file_upload',
  SIGNATURE = 'signature',
  EMAIL_VERIFY = 'email_verify'
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface ElementValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface ElementProperties {
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | string[];
  options?: Array<{ label: string; value: string }>;
  validation?: ElementValidation;
  readonly?: boolean;
  hidden?: boolean;
}

export interface FormElement {
  id: string;
  type: ElementType;
  position: ElementPosition;
  properties: ElementProperties;
  createdAt: Date;
  updatedAt: Date;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  elements: FormElement[];
  settings: FormSettings;
  organizationId: string;
  createdBy: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSettings {
  submitRedirectUrl?: string;
  emailNotifications?: string[];
  salesforceIntegration?: {
    enabled: boolean;
    objectType: string;
    fieldMappings: Record<string, string>;
  };
  allowDuplicateSubmissions: boolean;
  requireAuthentication: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedBy?: string;
  submittedAt: Date;
  ipAddress: string;
  userAgent: string;
  status: SubmissionStatus;
}

export enum SubmissionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  SPAM = 'spam'
}