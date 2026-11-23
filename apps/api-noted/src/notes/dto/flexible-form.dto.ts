export type FormFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'color'
  | 'range'
  | 'signature'
  | 'rating'
  | 'currency'
  | 'section'
  | 'repeater';

export interface FormConditionalRule {
  dependOnKey: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'contains' | 'is_filled';
  value?: any;
  action: 'show' | 'hide';
}

export interface RepeaterColumnDef {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
}

export interface FormWizardStep {
  id: number;
  title: string;
  description?: string;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  wizardStep?: number;
  layoutWidth?: 'full' | 'half' | 'third';
  conditional?: FormConditionalRule;
  calculationFormula?: string;
  repeaterColumns?: RepeaterColumnDef[];
  sectionTitle?: string;
  sectionDesc?: string;
}

export interface CreateDataFormDto {
  tujuan: string;
  keterangan?: string;
  fields: FormFieldDefinition[];
  sharingMode?: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  allowSelfEdit?: boolean;
  isLocked?: boolean;
  formLayoutMode?: 'STANDARD' | 'WIZARD' | 'CARDS';
  steps?: FormWizardStep[];
  maxResponses?: number | null;
  closeAt?: string | null;
}

export interface UpdateDataFormDto {
  tujuan?: string;
  keterangan?: string;
  fields?: FormFieldDefinition[];
  sharingMode?: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  allowSelfEdit?: boolean;
  isLocked?: boolean;
  formLayoutMode?: 'STANDARD' | 'WIZARD' | 'CARDS';
  steps?: FormWizardStep[];
  maxResponses?: number | null;
  closeAt?: string | null;
}

export interface FormAccessRuleDto {
  friendUserId: string;
  friendName: string;
  friendEmail?: string;
  canSubmit: boolean;
  canViewAllResponses: boolean;
  canEditSchema: boolean;
}

export interface UpdateFormAccessDto {
  sharingMode: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  rules?: FormAccessRuleDto[];
}

export interface SubmitFormValueDto {
  answers: Record<string, any>;
  responderName?: string;
  responderEmail?: string;
  originHost?: string;
}

export interface UpdateFormValueDto {
  answers?: Record<string, any>;
  status?: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  verifierNotes?: string;
}
