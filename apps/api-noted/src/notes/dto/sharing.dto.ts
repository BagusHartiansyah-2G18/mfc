export interface UpdateNoteSharingDto {
  sharingMode: 'PUBLIC' | 'KHUSUS' | 'PRIVATE';
  shareElements?: {
    xcatatan?: boolean;
    xfile?: boolean;
    xform?: boolean;
  };
}
