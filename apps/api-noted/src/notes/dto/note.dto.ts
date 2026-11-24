export interface CreateNoteDto {
  judul: string;
  ringkasan: string;
  catatanDetail?: string;
  tingkat?: number;
  kdJudul?: string; // Jika membuat sub-note, ini adalah kdJudul induk
  kdMember?: string;
  status?: string;
  priority?: string;
  stage?: string;
  weight?: number;
  targetBudget?: number;
  startDate?: string;
  dueDate?: string;
  picName?: string;
  picId?: string;
  approverId?: string;
  tags?: string;
  sharingMode?: string;
  isAiGenerated?: boolean;
}

export interface UpdateNoteDto {
  kdJudul: string;
  kdMember?: string;
  tingkat?: number;
  judul?: string;
  ringkasan?: string;
  catatanDetail?: string;
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
  publikasi?: boolean;
  sharingMode?: string;
  isAiGenerated?: boolean;
  aiHealthScore?: string;
  aiSummary?: string;
}

export interface QueryNoteDto {
  tingkat?: number | string;
  kdMember?: string;
  status?: string;
  priority?: string;
  stage?: string;
  search?: string;
}

export interface QuerySubNoteDto {
  id?: string;
  kdJudul?: string;
  kdMember?: string;
  tingkat?: number | string;
}

export interface AddMemberDto {
  userId: string;
  userName: string;
  userEmail: string;
  role: 'OWNER' | 'APPROVER' | 'CONTRIBUTOR' | 'FOLLOWER';
  canEdit?: boolean;
  canApprove?: boolean;
  avatarUrl?: string;
}

export interface UpdateMemberDto {
  role?: 'OWNER' | 'APPROVER' | 'CONTRIBUTOR' | 'FOLLOWER';
  canEdit?: boolean;
  canApprove?: boolean;
  inviteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface AddNoteFileDto {
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'doc' | 'link';
  mimeType?: string;
  fileSizeBytes?: number;
  category?: 'SOP' | 'FOTO' | 'BAST' | 'INVOICE' | 'OTHER';
  keterangan?: string;
}

export interface ScaffoldStagesDto {
  preset?: 'MFC_STANDARD' | 'PROCUREMENT' | 'AUDIT';
  customStages?: Array<{
    stage: string;
    judul: string;
    ringkasan: string;
    weight: number;
    budgetPercent?: number;
    tags?: string;
  }>;
}

export interface CreateApprovalDto {
  stageName: string;
  comments?: string;
  digitalSignature?: string;
}

export interface DecideApprovalDto {
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
  digitalSignature?: string;
}

// --- Supporting Forms DTOs ---

export interface CreateTransactionDto {
  trxDate: string;
  nomorKuitansi?: string;
  uraian: string;
  nominal: number;
  category?: string; // HONORARIUM, PENGADAAN, OPERASIONAL, LISENSI
  receiptUrl?: string;
}

export interface CreateChecklistDto {
  itemText: string;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateChecklistDto {
  itemText?: string;
  isCompleted?: boolean;
  syncProgress?: boolean; // Jika true, progres catatan otomatis dihitung ulang
}
