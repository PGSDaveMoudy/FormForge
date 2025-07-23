export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings: OrganizationSettings;
  salesforceConfig?: SalesforceConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  allowPublicForms: boolean;
  maxFormsPerUser: number;
  maxSubmissionsPerForm: number;
  customBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface SalesforceConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  isConnected: boolean;
  lastSyncAt?: Date;
}

export interface SalesforceObject {
  name: string;
  label: string;
  fields: SalesforceField[];
}

export interface SalesforceField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  picklistValues?: Array<{ label: string; value: string }>;
}