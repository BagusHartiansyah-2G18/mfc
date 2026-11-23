export interface NoteMember {
  id: string;
  kdJudul: string;
  kdMember: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'OWNER' | 'APPROVER' | 'CONTRIBUTOR' | 'FOLLOWER';
  canEdit?: boolean;
  canApprove?: boolean;
  inviteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  avatarUrl?: string | null;
  invitedAt?: string;
}

export interface JudulFile {
  id: string;
  kdJudul: string;
  kdMember: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'doc' | 'link';
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  checksumSha256?: string | null;
  category?: 'SOP' | 'FOTO' | 'BAST' | 'INVOICE' | 'OTHER' | null;
  keterangan?: string | null;
  ocrStatus?: 'PENDING' | 'EXTRACTED' | 'SKIPPED' | null;
  extractedText?: string | null;
  createdAt?: string;
}

export interface NoteApproval {
  id: string;
  kdJudul: string;
  kdMember: string;
  stageName: string;
  requestedById: string;
  approverId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string | null;
  digitalSignature?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
}

export interface JudulTransaction {
  id: string;
  kdJudul: string;
  kdMember: string;
  trxDate: string;
  nomorKuitansi?: string | null;
  uraian: string;
  nominal: number | string;
  category?: string | null; // "HONORARIUM", "PENGADAAN", "OPERASIONAL", "LISENSI"
  receiptUrl?: string | null;
  recordedById?: string;
  recordedByName?: string;
  createdAt?: string;
}

export interface JudulChecklist {
  id: string;
  kdJudul: string;
  kdMember: string;
  itemText: string;
  isCompleted: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  orderSeq?: number;
  createdAt?: string;
}

export interface JudulNote {
  id?: string;
  kdJudul: string;
  parentKdJudul?: string | null;
  kdMember: string;
  kdMemberSub?: string;
  judul: string;
  ringkasan: string;
  catatanDetail?: string | null;
  tingkat: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  stage?: 'ANALISIS' | 'UI_DESIGN' | 'DEVELOP' | 'TESTING' | 'DEPLOY';
  progress: number;
  weight?: number;
  targetBudget?: number | null;
  realizedBudget?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  picId?: string | null;
  picName?: string | null;
  approverId?: string | null;
  publikasi?: boolean;
  sharingMode?: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  shareElements?: { xcatatan?: boolean; xfile?: boolean; xform?: boolean };
  tags?: string | null;
  isAiGenerated?: boolean;
  aiHealthScore?: string | null;
  aiSummary?: string | null;
  createdAt?: string;
  updatedAt?: string;
  files?: JudulFile[];
  collaborators?: NoteMember[];
  approvals?: NoteApproval[];
  transactions?: JudulTransaction[];
  checklists?: JudulChecklist[];
  dynamicForms?: DataForm[];
}

export type FormFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
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
  operator: 'equals' | 'not_equals' | 'greater_than' | 'contains' | 'is_filled' | 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value?: any;
  action: 'show' | 'hide' | 'SHOW' | 'HIDE';
}

export interface RepeaterColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'select';
  placeholder?: string;
  options?: string[];
}

export interface FormWizardStep {
  id: number;
  title: string;
  description?: string;
  fieldKeys?: string[];
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helperText?: string;
  description?: string;
  columns?: any[];
  min?: number;
  max?: number;
  step?: number;
  // Next-Level Upgrades
  wizardStep?: number;
  layoutWidth?: 'full' | 'half' | 'third';
  conditional?: FormConditionalRule;
  calculationFormula?: string;
  repeaterColumns?: RepeaterColumnDef[];
  sectionTitle?: string;
  sectionDesc?: string;
}

export interface DataFormAccess {
  id: string;
  formId: string;
  friendUserId: string;
  friendName: string;
  friendEmail?: string | null;
  canSubmit: boolean;
  canViewAllResponses: boolean;
  canEditSchema: boolean;
  createdAt?: string;
}

export interface FormAccessRuleDto {
  friendUserId: string;
  friendName?: string;
  friendEmail?: string;
  canSubmit: boolean;
  canViewAllResponses: boolean;
  canEditSchema: boolean;
}

export interface DataForm {
  id: string;
  kd?: string;
  kdMember?: string;
  kdMemberSub?: string | null;
  kdNote?: string;
  tingkat?: number;
  tujuan: string;
  keterangan?: string | null;
  schemaVersion: number;
  fields: FormFieldDefinition[];
  sharingMode: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  isLocked: boolean;
  allowSelfEdit: boolean;
  shareSlug?: string | null;
  embedToken?: string | null;
  formLayoutMode?: 'STANDARD' | 'WIZARD' | 'CARDS';
  steps?: FormWizardStep[];
  maxResponses?: number | null;
  closeAt?: string | null;
  pinProtection?: string | null;
  createdAt: string;
  updatedAt?: string;
  accessRules?: DataFormAccess[];
  responseCount?: number;
  isExpired?: boolean;
  isQuotaFull?: boolean;
}

export interface ValueForm {
  id: string;
  formId: string;
  schemaVersion: number;
  responderId?: string | null;
  responderName: string;
  responderEmail?: string | null;
  originHost?: string;
  answers: {
    answers: Record<string, any>;
    submittedAt?: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  verifierNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFriend {
  id: string;
  userId?: string;
  friendUserId: string;
  friendName: string;
  friendEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  isRequester?: boolean;
  createdAt?: string;
}

export interface FlatFormColumn {
  key: string;
  label: string;
  type: string;
}

export interface FlatFormProjection {
  formId: string;
  formTitle: string;
  schemaVersion: number;
  sharingMode: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  isLocked: boolean;
  shareSlug?: string | null;
  totalResponses: number;
  columns: FlatFormColumn[];
  rows: Record<string, any>[];
}

export interface NoteBreadcrumb {
  kdJudul: string;
  judul: string;
  ringkasan: string;
  tingkat: number;
  kdMember: string;
  status?: string;
  progress?: number;
  parentKdJudul?: string | null;
  targetBudget?: number | null;
  realizedBudget?: number | null;
}

export interface NoteSubResponse {
  current?: JudulNote;
  induk: NoteBreadcrumb[];
  sub: JudulNote[];
}

export interface NoteFormData {
  judul: string;
  ringkasan: string;
  catatanDetail?: string;
  tingkat: number;
  kdJudul?: string;
  kdMember?: string;
  status?: string;
  priority?: string;
  stage?: string;
  progress?: number;
  weight?: number;
  targetBudget?: number;
  realizedBudget?: number;
  startDate?: string;
  dueDate?: string;
  picName?: string;
  picId?: string;
  approverId?: string;
  tags?: string;
  sharingMode?: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
}
