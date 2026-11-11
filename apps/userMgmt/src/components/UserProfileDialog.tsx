import { useState, useEffect, type FormEvent } from 'react';
import {
  User as UserIcon,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Shield,
  Edit3,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Clock,
  Sparkles,
  Lock,
  X,
  Check,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Alert,
  AlertDescription,
  // Centralized @org/ui components
  FormField,
  InputWithIcon,
  SelectField,
  PasswordInput,
  StatusBadge,
  TabNav,
} from '@org/ui';
import { userMgmtStore } from '../store/user-mgmt-store';
import type { User, Role, UserGender, UserProfile } from '../types/user-mgmt';

interface UserProfileDialogProps {
  user: User | null;
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function UserProfileDialog({
  user,
  role,
  open,
  onOpenChange,
  onUpdated,
}: UserProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');

  // Form State untuk Edit Profil
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<UserGender | string>('Laki-laki');
  const [birthDate, setBirthDate] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const genderOptions = [
    { value: 'Laki-laki', label: 'Laki-laki' },
    { value: 'Perempuan', label: 'Perempuan' },
    { value: 'Lainnya', label: 'Lainnya' },
  ];

  // Populate form saat user berubah
  useEffect(() => {
    if (user) {
      setPhone(user.profile?.phone || '');
      setAddress(user.profile?.address || '');
      setGender(user.profile?.gender || 'Laki-laki');
      setBirthDate(
        user.profile?.birthDate
          ? user.profile.birthDate.split('T')[0]
          : ''
      );
      setJobTitle(user.profile?.jobTitle || '');
      setDepartment(user.profile?.department || '');
      setBio(user.profile?.bio || '');
      setActiveTab('view');
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [user]);

  if (!user) return null;

  const profile = user.profile;

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedProfile: Partial<UserProfile> = {
        phone: phone.trim(),
        address: address.trim(),
        gender,
        birthDate: birthDate || undefined,
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        bio: bio.trim(),
      };

      userMgmtStore.updateUserProfile(user.id, updatedProfile);
      setSuccessMessage('Informasi profil pengguna berhasil diperbarui!');
      onUpdated?.();

      setTimeout(() => {
        setActiveTab('view');
        setSuccessMessage('');
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan profil pengguna'
      );
    } finally {
      setSaving(false);
    }
  };

  const formattedBirthDate = profile?.birthDate
    ? new Date(profile.birthDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Belum diisi';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border/40 shadow-2xl shadow-primary/5 dark:shadow-black/50">
        {/* User Hero Header Banner */}
        <div className="bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent p-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ width: '95%' }}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`border-2 ${user.status === 'active' ? 'border-emerald-500' : 'border-muted-foreground/40'} flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary font-bold text-lg uppercase shadow-xs ring-4 ring-primary/10`}>
                  {user.name.slice(0, 2)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-foreground">
                    {user.name}
                  </DialogTitle>
                  <span className="text-[10px] font-medium rounded-lg px-2.5 py-0.5 border border-primary/25 bg-primary/10 text-primary dark:bg-primary/15 inline-flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>{role?.name || 'User'}</span>
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground/80 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-primary font-semibold">@{user.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {user.email}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="w-full sm:w-auto">
              <TabNav
                items={[
                  { id: 'view', label: 'Ringkasan', icon: <FileText className="h-3.5 w-3.5" /> },
                  { id: 'edit', label: 'Ubah Data', icon: <Edit3 className="h-3.5 w-3.5" /> },
                ]}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'view' | 'edit')}
                variant="segmented"
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Status Feedback Banners */}
        {
          successMessage || errorMessage &&
          <div className="px-6 pt-3 empty:hidden">
            {successMessage && (
              <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-2.5 px-3.5 rounded-xl text-xs animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <AlertDescription className="font-medium">{successMessage}</AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="py-2.5 px-3.5 rounded-xl text-xs animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        }
        

        {/* Modal Scrollable Body */}
        <div className="px-6 max-h-[62vh] overflow-y-auto space-y-4 text-xs">
          {activeTab === 'view' ? (
            <div className="space-y-4 animate-in fade-in-50">
              {/* Bento Grid 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Kontak & Komunikasi */}
                <div className="rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs pb-2 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span>Kontak & Komunikasi</span>
                  </div>
                  <div className="space-y-2 pt-0.5">
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block">Nomor HP / WhatsApp</span>
                      <span className="font-mono font-medium text-foreground text-xs">
                        {profile?.phone || <span className="text-muted-foreground/70 italic font-sans">Belum diisi</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block">Email Terdaftar</span>
                      <span className="font-mono text-foreground text-xs">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Kepegawaian & Posisi */}
                <div className="rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs pb-2 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <span>Kepegawaian & Posisi</span>
                  </div>
                  <div className="space-y-2 pt-0.5">
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block">Jabatan / Posisi</span>
                      <span className="font-medium text-foreground text-xs">
                        {profile?.jobTitle || <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block">Departemen / Divisi</span>
                      <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {profile?.department || <span className="text-muted-foreground/70 italic">Belum diisi</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Informasi Personal */}
                <div className="rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs pb-2 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                    <span>Informasi Personal</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block">Jenis Kelamin</span>
                      <span className="font-medium text-foreground text-xs mt-0.5 block">
                        {profile?.gender || 'Belum diisi'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block">Tanggal Lahir</span>
                      <span className="font-medium text-foreground text-xs flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                        {formattedBirthDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Keamanan & Akun */}
                <div className="rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs pb-2 border-b border-border/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <span>Keamanan & Kredensial</span>
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <div>
                      <span className="text-[11px] text-muted-foreground/80 block mb-1">Password Kredensial</span>
                      <PasswordInput displayMaskedOnly />
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
                      <Clock className="h-3 w-3" />
                      <span>Terdaftar: {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Alamat Domisili */}
              <div className="rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-foreground text-xs pb-2 border-b border-border/30">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span>Alamat Domisili Lengkap</span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/90 font-sans pt-0.5">
                  {profile?.address || (
                    <span className="text-muted-foreground/70 italic">Alamat domisili belum dilengkapi oleh pengguna.</span>
                  )}
                </p>
              </div>

              {/* 6. Bio / Catatan Tambahan */}
              <div className="rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 transition-all p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-foreground text-xs pb-2 border-b border-border/30">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span>Catatan Internal & Biodata Ringkas</span>
                </div>
                <p className="text-xs text-muted-foreground/90 leading-relaxed italic pt-0.5">
                  &ldquo;{profile?.bio || 'Tidak ada catatan internal khusus untuk pengguna ini.'}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            /* TAB EDIT FORM */
            <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in-50">
              <div className="rounded-2xl border border-border/40 bg-muted/20 p-4.5 space-y-4">
                <div className="font-semibold text-foreground text-xs pb-2 border-b border-border/30 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Briefcase className="h-3.5 w-3.5" />
                  </div>
                  <span>Kontak & Data Kepegawaian</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                  <FormField label="Nomor HP / WhatsApp" htmlFor="prof-phone">
                    <InputWithIcon
                      id="prof-phone"
                      icon={<Phone className="h-3.5 w-3.5 text-primary" />}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812-3456-7890"
                    />
                  </FormField>

                  <SelectField
                    id="prof-gender"
                    label="Jenis Kelamin"
                    options={genderOptions}
                    value={gender}
                    onChange={(val) => setGender(val as UserGender)}
                  />

                  <FormField label="Jabatan / Posisi" htmlFor="prof-job">
                    <InputWithIcon
                      id="prof-job"
                      icon={<Briefcase className="h-3.5 w-3.5" />}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Contoh: Senior Frontend Engineer"
                    />
                  </FormField>

                  <FormField label="Departemen / Divisi" htmlFor="prof-dept">
                    <InputWithIcon
                      id="prof-dept"
                      icon={<Building2 className="h-3.5 w-3.5" />}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Contoh: Engineering & Platform"
                    />
                  </FormField>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-muted/20 p-4.5 space-y-4">
                <div className="font-semibold text-foreground text-xs pb-2 border-b border-border/30 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span>Biodata & Domisili</span>
                </div>
                <div className="space-y-4 p-2">
                  <FormField label="Tanggal Lahir" htmlFor="prof-birth">
                    <Input
                      id="prof-birth"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Alamat Lengkap" htmlFor="prof-addr">
                    <Textarea
                      id="prof-addr"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Jalan, Nomor, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </FormField>

                  <FormField label="Bio / Catatan Tambahan" htmlFor="prof-bio">
                    <Textarea
                      id="prof-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Catatan kepegawaian, sertifikasi, atau ringkasan tugas..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </FormField>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
          {activeTab === 'view' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-9 px-4 text-xs font-medium border-border/50 hover:bg-muted/50"
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTab('edit')}
                className="rounded-xl h-9 px-4 gap-1.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Ubah Data Profil</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('view')}
                disabled={saving}
                className="rounded-xl h-9 px-4 text-xs font-medium border-border/50 hover:bg-muted/50"
              >
                Kembali ke Detail
              </Button>
              <Button
                type="submit"
                form="edit-profile-form"
                size="sm"
                disabled={saving}
                className="rounded-xl h-9 px-4 gap-1.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
