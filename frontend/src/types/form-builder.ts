export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface FormElementBase {
  id: string;
  type: FormElementType;
  position: Position;
  size: Size;
  properties: Record<string, any>;
  validation?: ValidationRule[];
  isRequired?: boolean;
  label?: string;
  placeholder?: string;
  helpText?: string;
}

export enum FormElementType {
  TEXT_INPUT = 'TEXT_INPUT',
  NUMBER_INPUT = 'NUMBER_INPUT',
  EMAIL_INPUT = 'EMAIL_INPUT',
  TEXTAREA = 'TEXTAREA',
  PICKLIST = 'PICKLIST',
  MULTI_PICKLIST = 'MULTI_PICKLIST',
  DATE_PICKER = 'DATE_PICKER',
  TIME_PICKER = 'TIME_PICKER',
  CHECKBOX = 'CHECKBOX',
  RADIO_GROUP = 'RADIO_GROUP',
  FILE_UPLOAD = 'FILE_UPLOAD',
  SIGNATURE = 'SIGNATURE',
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  RICH_TEXT = 'RICH_TEXT',
  ADDRESS = 'ADDRESS',
  PHONE = 'PHONE',
  SECTION_HEADER = 'SECTION_HEADER',
  DIVIDER = 'DIVIDER'
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'custom';
  value?: any;
  message: string;
}

export interface TextInputElement extends FormElementBase {
  type: FormElementType.TEXT_INPUT;
  properties: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
  };
}

export interface NumberInputElement extends FormElementBase {
  type: FormElementType.NUMBER_INPUT;
  properties: {
    min?: number;
    max?: number;
    step?: number;
    decimals?: number;
  };
}

export interface TextAreaElement extends FormElementBase {
  type: FormElementType.TEXTAREA;
  properties: {
    rows?: number;
    maxLength?: number;
    resizable?: boolean;
  };
}

export interface PicklistElement extends FormElementBase {
  type: FormElementType.PICKLIST | FormElementType.MULTI_PICKLIST;
  properties: {
    options: PicklistOption[];
    allowOther?: boolean;
    searchable?: boolean;
  };
}

export interface PicklistOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupElement extends FormElementBase {
  type: FormElementType.RADIO_GROUP;
  properties: {
    options: PicklistOption[];
    layout: 'vertical' | 'horizontal';
  };
}

export interface CheckboxElement extends FormElementBase {
  type: FormElementType.CHECKBOX;
  properties: {
    text: string;
    checkedValue?: string;
    uncheckedValue?: string;
  };
}

export interface DatePickerElement extends FormElementBase {
  type: FormElementType.DATE_PICKER;
  properties: {
    format?: string;
    minDate?: string;
    maxDate?: string;
    showTime?: boolean;
  };
}

export interface FileUploadElement extends FormElementBase {
  type: FormElementType.FILE_UPLOAD;
  properties: {
    acceptedTypes?: string[];
    maxFileSize?: number;
    maxFiles?: number;
    allowMultiple?: boolean;
  };
}

export type FormElement = 
  | TextInputElement
  | NumberInputElement
  | TextAreaElement
  | PicklistElement
  | RadioGroupElement
  | CheckboxElement
  | DatePickerElement
  | FileUploadElement
  | FormElementBase;

export interface FormBuilderState {
  elements: FormElement[];
  selectedElementId: string | null;
  canvasSize: Size;
  gridSize: number;
  snapToGrid: boolean;
  zoom: number;
}

export interface DragItem {
  type: string;
  elementType?: FormElementType;
  elementId?: string;
  element?: FormElement;
}

export interface DropResult {
  position: Position;
  elementType?: FormElementType;
  elementId?: string;
}