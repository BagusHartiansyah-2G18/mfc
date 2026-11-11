import { useState, useMemo, type FormEvent } from 'react';
import {
  Search,
  Plus,
  Shield,
  KeyRound,
  Trash2,
  FileText,
  Phone,
  Lock,
  Building2,
  Briefcase,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserPlus,
  ShieldAlert,
  Mail,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  cn,
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Alert,
  AlertDescription,
  InputWithIcon,
  PasswordInput,
  FormField,
  SelectField,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Combobox,
  StatusBadge,
  TabNav,
  DataTable,
  type ColumnDef,
} from '@org/ui';
import { userMgmtStore } from '../store/user-mgmt-store';
import { UserProfileDialog } from './UserProfileDialog';
import type { User, Role, UserStatus, UserGender } from '../types/user-mgmt';

function getAvatarGradient(name: string) {
  const gradients = [
    'from-indigo-500/25 to-purple-500/10 text-indigo-300 ring-indigo-500/30',
    'from-sky-500/25 to-blue-500/10 text-sky-300 ring-sky-500/30',
    'from-emerald-500/25 to-teal-500/10 text-emerald-300 ring-emerald-500/30',
    'from-amber-500/25 to-orange-500/10 text-amber-300 ring-amber-500/30',
    'from-rose-500/25 to-pink-500/10 text-rose-300 ring-rose-500/30',
    'from-violet-500/25 to-fuchsia-500/10 text-violet-300 ring-violet-500/30',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function getRoleBadgeStyle(roleId: string, isSystem?: boolean) {
  if (isSystem || roleId === 'role-superadmin' || roleId === 'role-admin') {
    return {
      container: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 dark:text-indigo-300 dark:bg-indigo-500/15 ring-1 ring-indigo-500/20',
      icon: 'text-indigo-400',
    };
  }
  if (roleId === 'role-pm') {
    return {
      container: 'border-violet-500/30 bg-violet-500/10 text-violet-400 dark:text-violet-300 dark:bg-violet-500/15 ring-1 ring-violet-500/20',
      icon: 'text-violet-400',
    };
  }
  if (roleId === 'role-dev') {
    return {
      container: 'border-sky-500/30 bg-sky-500/10 text-sky-400 dark:text-sky-300 dark:bg-sky-500/15 ring-1 ring-sky-500/20',
      icon: 'text-sky-400',
    };
  }
  if (roleId === 'role-client') {
    return {
      container: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 dark:text-emerald-300 dark:bg-emerald-500/15 ring-1 ring-emerald-500/20',
      icon: 'text-emerald-400',
    };
  }
  return {
    container: 'border-blue-500/30 bg-blue-500/10 text-blue-400 dark:text-blue-300 dark:bg-blue-500/15 ring-1 ring-blue-500/20',
    icon: 'text-blue-400',
  };
}

interface UserTabProps {
  users: User[];
  roles: Role[];
}

export function UserTab({ users, roles }: UserTabProps) {
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [addTab, setAddTab] = useState<'account' | 'profile'>('account');
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id ?? 'role-dev');
  const [status, setStatus] = useState<UserStatus>('active');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<UserGender>('Laki-laki');
  const [birthDate, setBirthDate] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    roles.forEach((r) => map.set(r.id, r));
    return map;
  }, [roles]);

  // Dynamic Multi-function Validation & Error Calculation
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // 1. Username Validation
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      errs.username = 'Username wajib diisi.';
    } else if (/\s/.test(username)) {
      errs.username = 'Username tidak boleh mengandung spasi.';
    } else if (/[A-Z]/.test(username)) {
      errs.username = 'Gunakan huruf kecil saja tanpa huruf kapital.';
    } else if (!/^[a-z0-9._-]+$/.test(username)) {
      errs.username = 'Hanya huruf kecil, angka, titik (.), strip (-), dan underscore (_).';
    } else if (trimmedUser.length < 3) {
      errs.username = 'Username minimal 3 karakter.';
    } else if (users.some((u) => u.username.toLowerCase() === trimmedUser.toLowerCase())) {
      errs.username = `Username '@${trimmedUser}' sudah digunakan oleh pengguna lain.`;
    }

    // 2. Name Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = 'Nama lengkap wajib diisi.';
    } else if (trimmedName.length < 2) {
      errs.name = 'Nama lengkap minimal 2 karakter.';
    }

    // 3. Email Validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Format email tidak valid (contoh: user@bgs-software.id).';
    } else if (users.some((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      errs.email = `Email '${trimmedEmail}' sudah terdaftar pada pengguna lain.`;
    }

    // 4. Role Validation
    if (!roleId) {
      errs.roleId = 'Role hak akses wajib dipilih.';
    }

    // 5. Password Validation
    if (!password) {
      errs.password = 'Password kredensial wajib diisi.';
    } else if (password.length < 6) {
      errs.password = `Password minimal 6 karakter (saat ini ${password.length} karakter).`;
    }

    // 6. Confirm Password Validation
    if (!confirmPassword) {
      errs.confirmPassword = 'Ulangi password untuk konfirmasi verifikasi.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Konfirmasi password tidak cocok dengan password di atas.';
    }

    // 7. Phone Validation (Optional)
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[\s\-()+]/g, '');
      if (/[^\d\s\-()+]/.test(phone)) {
        errs.phone = 'Nomor HP hanya boleh berisi angka, spasi, +, -, dan ().';
      } else if (cleanPhone.length < 8) {
        errs.phone = 'Nomor HP minimal terdiri dari 8 digit angka.';
      }
    }

    // 8. Birth Date Validation (Optional)
    if (birthDate) {
      const selectedDate = new Date(birthDate);
      if (selectedDate > new Date()) {
        errs.birthDate = 'Tanggal lahir tidak boleh di masa depan.';
      }
    }

    return errs;
  }, [username, name, email, roleId, password, confirmPassword, phone, birthDate, users]);

  const roleFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Semua Role' },
      ...roles.map((r) => ({ value: r.id, label: r.name })),
    ];
  }, [roles]);

  const statusFilterOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
  ];

  const roleSelectOptions = useMemo(() => {
    return roles.map((r) => ({ value: r.id, label: r.name }));
  }, [roles]);

  const genderSelectOptions = [
    { value: 'Laki-laki', label: 'Laki-laki' },
    { value: 'Perempuan', label: 'Perempuan' }, 
  ];

  const statusSelectOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.profile?.phone && u.profile.phone.toLowerCase().includes(search.toLowerCase())) ||
        (u.profile?.jobTitle && u.profile.jobTitle.toLowerCase().includes(search.toLowerCase()));
      const matchRole = selectedRoleFilter === 'all' || u.roleId === selectedRoleFilter;
      const matchStatus = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, selectedRoleFilter, selectedStatusFilter]);

  const columns = useMemo<ColumnDef<User, any>[]>(() => [
    {
      id: 'pengguna',
      header: 'PENGGUNA',
      enableSorting: false,
      size: 190,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          {row.original.profile?.avatarUrl ? (
            <img
              src={row.original.profile.avatarUrl}
              alt={row.original.name}
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-primary/20 shadow-xs"
            />
          ) : (
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-xs uppercase ring-1 shadow-xs',
                getAvatarGradient(row.original.name)
              )}
            >
              {row.original.name.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-xs leading-tight truncate">{row.original.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">@{row.original.username}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'informasi_tambahan',
      header: 'INFORMASI TAMBAHAN',
      enableSorting: false,
      size: 160,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.original.profile?.phone ? (
            <div className="font-mono text-[11px] text-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{row.original.profile.phone}</span>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground italic">No. HP belum diisi</div>
          )}
          {row.original.profile?.jobTitle && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[150px]">
              <Briefcase className="h-2.5 w-2.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{row.original.profile.jobTitle}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'EMAIL',
      enableSorting: true,
      size: 150,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground truncate max-w-[150px]">
          <Mail className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span className="truncate">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'roleId',
      header: 'ROLE',
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const role = roleMap.get(row.original.roleId);
        const style = getRoleBadgeStyle(row.original.roleId, role?.isSystem);
        return (
          <span
            className={cn(
              'whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-xs transition-colors',
              style.container
            )}
          >
            <Shield className={cn('h-3.5 w-3.5 shrink-0', style.icon)} />
            <span className="truncate max-w-[130px]">{role?.name ?? 'Tidak Ada Role'}</span>
          </span>
        );
      },
    },
    {
      id: 'password',
      header: 'PASSWORD',
      enableSorting: false,
      size: 95,
      cell: () => <PasswordInput displayMaskedOnly />,
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      enableSorting: true,
      size: 80,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'AKSI',
      enableSorting: false,
      enableHiding: false,
      size: 75,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Lihat / Edit Informasi Tambahan"
              onClick={() => {
                setSelectedUserForProfile(user);
                setIsProfileOpen(true);
              }}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground/80 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Reset Password"
              onClick={() => {
                setTargetUser(user);
                setPassword('');
                setConfirmPassword('');
                setErrorMessage('');
                setIsResetOpen(true);
              }}
            >
              <KeyRound className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Hapus User"
              disabled={user.username === 'superadmin'}
              onClick={() => handleDelete(user)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], [roleMap, users]);

  const [resetTouched, setResetTouched] = useState(false);
  const resetPasswordError = useMemo(() => {
    if (!password) return 'Password kredensial baru wajib diisi.';
    if (password.length < 6) return `Password minimal 6 karakter (saat ini ${password.length} karakter).`;
    return '';
  }, [password]);

  const resetConfirmError = useMemo(() => {
    if (!confirmPassword) return 'Ulangi password baru untuk konfirmasi verifikasi.';
    if (password !== confirmPassword) return 'Konfirmasi password tidak cocok dengan password baru di atas.';
    return '';
  }, [password, confirmPassword]);

  const handleOpenAdd = () => {
    setUsername('');
    setName('');
    setEmail('');
    setRoleId(roles[0]?.id ?? 'role-dev');
    setStatus('active');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setGender('Laki-laki');
    setBirthDate('');
    setJobTitle('');
    setDepartment('');
    setAddress('');
    setAddTab('account');
    setShowAdditionalInfo(false);
    setErrorMessage('');
    setTouched({});
    setIsAddOpen(true);
  };

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Mark all fields as touched to trigger individual helper/error messages
    setTouched({
      username: true,
      name: true,
      email: true,
      roleId: true,
      password: true,
      confirmPassword: true,
      phone: true,
      birthDate: true,
    });

    const hasAccountErrors = Boolean(
      errors.username || errors.name || errors.email || errors.roleId || errors.password || errors.confirmPassword
    );
    const hasProfileErrors = Boolean(errors.phone || errors.birthDate);

    if (hasAccountErrors) {
      setAddTab('account');
      setErrorMessage(
        errors.username ||
          errors.name ||
          errors.email ||
          errors.password ||
          errors.confirmPassword ||
          errors.roleId ||
          'Silakan periksa dan perbaiki isian form yang tidak valid di bawah ini.'
      );
      return;
    }

    if (hasProfileErrors) {
      setAddTab('profile');
      setErrorMessage(errors.phone || errors.birthDate || 'Silakan periksa format profil.');
      return;
    }

    userMgmtStore.addUser({
      username: username.trim(),
      name: name.trim(),
      email: email.trim(),
      roleId,
      status,
      password,
      profile: {
        phone: phone.trim() || undefined,
        gender,
        birthDate: birthDate || undefined,
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
        address: address.trim() || undefined,
      },
    });

    setIsAddOpen(false);
  };

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setResetTouched(true);
    setErrorMessage('');

    if (resetPasswordError || resetConfirmError) {
      setErrorMessage(resetPasswordError || resetConfirmError);
      return;
    }

    setIsResetOpen(false);
    setTargetUser(null);
  };

  const handleDelete = (user: User) => {
    if (user.username === 'superadmin') {
      alert('Akun Super Administrator dilindungi dan tidak dapat dihapus.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna @${user.username} (${user.name})?`)) {
      try {
        userMgmtStore.deleteUser(user.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Gagal menghapus user');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Modern Unified Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xs p-3.5 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[220px] max-w-sm">
            <InputWithIcon
              icon={<Search className="h-4 w-4 text-muted-foreground/70" />}
              clearable
              placeholder="Cari user, nama, email, hp, atau jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="default"
              className="bg-background/70 border-border/60 rounded-xl text-xs"
            />
          </div>
          <div className="w-48">
            <Combobox
              options={roleFilterOptions}
              value={selectedRoleFilter}
              onValueChange={(val) => setSelectedRoleFilter(val)}
              placeholder="Semua Role"
              searchPlaceholder="Cari role..."
              className="bg-background/70 border-border/60 rounded-xl text-xs"
            />
          </div>
          <div className="w-40 min-w-[140px]">
            <Combobox
              options={statusFilterOptions}
              value={selectedStatusFilter}
              onValueChange={(val) => setSelectedStatusFilter(val)}
              placeholder="Semua Status"
              searchPlaceholder="Cari status..."
              className="bg-background/70 border-border/60 rounded-xl text-xs"
            />
          </div>

          {(search || selectedRoleFilter !== 'all' || selectedStatusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedRoleFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              Reset Filter
            </Button>
          )}
        </div>

        <Button
          onClick={handleOpenAdd}
          className="h-9.5 gap-2 shadow-xs hover:shadow-md transition-all active:scale-[0.98] font-semibold text-xs rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary/95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/50 shadow-xs rounded-2xl overflow-hidden bg-card">
        <CardHeader className="px-5 py-4 border-b border-border/40 bg-card/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Daftar Pengguna & Informasi Akun
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2 rounded-full">
                  {filteredUsers.length} Terdaftar
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Klik baris untuk melihat atau mengedit informasi profil lengkap, jabatan, dan kredensial akun.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 px-2.5 py-1 rounded-full bg-muted/40 border border-border/40 font-medium self-start sm:self-auto">
              <Lock className="h-3 w-3 text-primary shrink-0" />
              <span>Password Hidden & Encrypted</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<User>
            columns={columns}
            data={filteredUsers}
            getRowId={(r) => r.id}
            enableSorting
            showPagination={false}
            tableContainerClassName="border-0 rounded-none shadow-none"
            onRowClick={(row) => {
              setSelectedUserForProfile(row);
              setIsProfileOpen(true);
            }}
            showSearch={false}
            emptyText="Tidak ada pengguna yang cocok"
            loading={false}
          />
        </CardContent>
      </Card>

      <UserProfileDialog
        user={selectedUserForProfile}
        role={selectedUserForProfile ? roleMap.get(selectedUserForProfile.roleId) : undefined}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onUpdated={() => {
          if (selectedUserForProfile) {
            setSelectedUserForProfile(userMgmtStore.getUserById(selectedUserForProfile.id) || null);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 1. MODAL TAMBAH PENGGUNA BARU                                            */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border/40 shadow-2xl shadow-primary/5 dark:shadow-black/50">
          {/* Modal Header dengan Visual Icon Banner & Segmented Tabs */}
          <div className="bg-gradient-to-b from-primary/8 via-primary/[0.02] to-transparent px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-2xs">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                  Tambah Pengguna Baru
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 leading-relaxed mt-0.5">
                  Daftarkan akun pengguna baru dengan password aman terenkripsi dan informasi profil lengkap.
                </DialogDescription>
              </div>
            </div>

            {/* Segmented Tab Navigasi Form */}
            <div className="mt-5 pt-0.5">
              <TabNav
                items={[
                  { id: 'account', label: '1. Akun & Kredensial', icon: <Shield className="h-3.5 w-3.5" /> },
                  { id: 'profile', label: '2. Profil & Biodata', icon: <FileText className="h-3.5 w-3.5" /> },
                ]}
                activeId={addTab}
                onChange={(id) => setAddTab(id as 'account' | 'profile')}
                variant="segmented"
                size="sm"
                fullWidth
              />
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="flex flex-col">
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4.5 text-xs">
              {errorMessage && (
                <Alert variant="destructive" className="py-2.5 px-3.5 rounded-xl text-xs animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {addTab === 'account' ? (
                <div className="space-y-3.5 animate-in fade-in-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormField
                      label="Username"
                      htmlFor="username"
                      required
                      error={touched.username ? errors.username : undefined}
                      helperText="Huruf kecil tanpa spasi (cth: john.doe, bagus)"
                    >
                      <InputWithIcon
                        id="username"
                        icon={<span className="text-muted-foreground/70 font-mono text-xs">@</span>}
                        placeholder="john.doe"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          markTouched('username');
                        }}
                        onBlur={() => markTouched('username')}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Nama Lengkap"
                      htmlFor="name"
                      required
                      error={touched.name ? errors.name : undefined}
                      helperText="Nama lengkap resmi sesuai identitas"
                    >
                      <Input
                        id="name"
                        placeholder="Contoh: Johnathan Doe"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          markTouched('name');
                        }}
                        onBlur={() => markTouched('name')}
                        required
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormField
                      label="Alamat Email Perusahaan"
                      htmlFor="email"
                      required
                      error={touched.email ? errors.email : undefined}
                      helperText="Email resmi perusahaan (cth: user@bgs-software.id)"
                    >
                      <InputWithIcon
                        id="email"
                        type="email"
                        icon={<Mail className="h-3.5 w-3.5 text-muted-foreground/70" />}
                        placeholder="john@bgs-software.id"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          markTouched('email');
                        }}
                        onBlur={() => markTouched('email')}
                        required
                      />
                    </FormField>

                    <FormField
                      label="Role Hak Akses"
                      htmlFor="role"
                      required
                      error={touched.roleId ? errors.roleId : undefined}
                      helperText="Pilih atau cari hak akses role"
                    >
                      <Combobox
                        id="role"
                        options={roleSelectOptions.map((r) => ({
                          value: r.value,
                          label: r.label,
                          icon: <Shield className="h-3.5 w-3.5 text-primary" />,
                        }))}
                        value={roleId}
                        onValueChange={(val) => {
                          setRoleId(val);
                          markTouched('roleId');
                        }}
                        placeholder="Pilih role..."
                        searchPlaceholder="Cari role..."
                      />
                    </FormField>
                  </div>

                  {/* Kredensial Keamanan Compact */}
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                      <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                        <Lock className="h-3.5 w-3.5 text-primary" />
                        <span>Kredensial Kata Sandi</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground/80 px-2 py-0.5 bg-background/80 border-border/40 font-normal">
                        Wajib Enkripsi
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FormField
                        label="Password Kredensial"
                        htmlFor="password"
                        required
                        error={touched.password ? errors.password : undefined}
                        helperText="Minimal 6 karakter"
                      >
                        <PasswordInput
                          id="password"
                          placeholder="Minimal 6 karakter"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            markTouched('password');
                          }}
                          onBlur={() => markTouched('password')}
                          showStrengthMeter
                          required
                        />
                      </FormField>

                      <FormField
                        label="Konfirmasi Password"
                        htmlFor="confirmPassword"
                        required
                        error={touched.confirmPassword ? errors.confirmPassword : undefined}
                        helperText="Ketik ulang password untuk verifikasi"
                      >
                        <PasswordInput
                          id="confirmPassword"
                          placeholder="Ulangi password di atas"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            markTouched('confirmPassword');
                          }}
                          onBlur={() => markTouched('confirmPassword')}
                          required
                        />
                      </FormField>
                    </div>
                  </div>

                  <FormField
                    label="Status Awal Akun"
                    htmlFor="status"
                    required
                    error={touched.status ? errors.status : undefined}
                    helperText="Pilih status keaktifan awal akun pengguna baru"
                  >
                    <Combobox
                      id="status"
                      options={statusSelectOptions}
                      value={status}
                      onValueChange={(val) => {
                        setStatus(val as UserStatus);
                        markTouched('status');
                      }}
                      placeholder="Pilih status akun..."
                      searchPlaceholder="Cari status..."
                    />
                  </FormField>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in-50">
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary/85 leading-relaxed">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <span>Informasi ini melengkapi data profil pengguna untuk keperluan administrasi dan kontak tim.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Nomor HP / WhatsApp"
                      htmlFor="phone"
                      error={touched.phone ? errors.phone : undefined}
                      helperText="Format nomor aktif (contoh: +62 812-xxxx-xxxx)"
                    >
                      <InputWithIcon
                        id="phone"
                        icon={<Phone className="h-3.5 w-3.5 text-primary" />}
                        placeholder="+62 812-xxxx-xxxx"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          markTouched('phone');
                        }}
                        onBlur={() => markTouched('phone')}
                      />
                    </FormField>

                    <FormField label="Jenis Kelamin" htmlFor="gender">
                      <Combobox
                        id="gender"
                        options={genderSelectOptions}
                        value={gender}
                        onValueChange={(val) => setGender(val as UserGender)}
                        placeholder="Pilih jenis kelamin..."
                        searchPlaceholder="Cari jenis kelamin..."
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Jabatan / Posisi" htmlFor="jobTitle" helperText="Peran atau posisi pengguna dalam tim">
                      <InputWithIcon
                        id="jobTitle"
                        icon={<Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />}
                        placeholder="Contoh: Frontend Lead"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </FormField>

                    <FormField label="Departemen / Divisi" htmlFor="department" helperText="Divisi atau departemen unit kerja">
                      <InputWithIcon
                        id="department"
                        icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />}
                        placeholder="Contoh: Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormField
                      label="Tanggal Lahir"
                      htmlFor="birthDate"
                      error={touched.birthDate ? errors.birthDate : undefined}
                      helperText="Format tanggal lahir YYYY-MM-DD"
                    >
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => {
                          setBirthDate(e.target.value);
                          markTouched('birthDate');
                        }}
                        onBlur={() => markTouched('birthDate')}
                        className="rounded-xl text-xs"
                      />
                    </FormField>

                    <FormField label="Alamat Lengkap Domisili" htmlFor="address" helperText="Alamat tempat tinggal atau domisili">
                      <Textarea
                        id="address"
                        placeholder="Jalan, RT/RW, Kota..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        className="text-xs resize-none rounded-xl"
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
              {addTab === 'account' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddTab('profile')}
                  className="rounded-xl h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <span>Lanjut isi profil</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddTab('account')}
                  className="rounded-xl h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Kembali ke akun</span>
                </Button>
              )}

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl h-9 px-4 text-xs font-medium border-border/50 hover:bg-muted/50"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="rounded-xl h-9 p-4 gap-1.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  <Check className="h-3.5 w-3.5" />
                  <span>Simpan Pengguna</span>
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. MODAL RESET PASSWORD PENGGUNA                                         */}
      {/* ========================================================================= */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border/40 shadow-2xl shadow-black/10 dark:shadow-black/50">
          {/* Header Reset Password */}
          <div className="bg-gradient-to-b from-amber-500/10 via-amber-500/[0.02] to-transparent px-6 pt-6 pb-4 border-b border-amber-500/15">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/5 shadow-2xs">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                  Reset Password Akun
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 mt-0.5">
                  Atur ulang kata sandi kredensial baru untuk pengguna yang dipilih.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="flex flex-col">
            <div className="px-6 py-5 space-y-4 text-xs">
              {errorMessage && (
                <Alert variant="destructive" className="py-2.5 px-3.5 rounded-xl text-xs animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Target User Identity Card */}
              {targetUser && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/40 bg-muted/25 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs ring-4 ring-primary/5">
                      {targetUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-xs truncate">
                        {targetUser.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground/80 font-mono truncate">
                        @{targetUser.username} • {targetUser.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0 font-medium rounded-full px-2.5 py-0.5">
                    {roleMap.get(targetUser.roleId)?.name ?? 'User'}
                  </Badge>
                </div>
              )}

              {/* Security Policy Alert */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-muted-foreground text-[11px] leading-relaxed">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground font-semibold block">Kebijakan Keamanan:</strong>
                  Password baru akan langsung di-hash Bcrypt kriptografis. Akun ini wajib menggunakan password baru saat login berikutnya.
                </div>
              </div>

              {/* Password Inputs */}
              <div className="space-y-4 pt-1">
                <FormField
                  label="Password Baru"
                  htmlFor="new-password"
                  required
                  error={resetTouched ? resetPasswordError : undefined}
                  helperText="Minimal 6 karakter"
                >
                  <PasswordInput
                    id="new-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setResetTouched(true);
                    }}
                    onBlur={() => setResetTouched(true)}
                    showStrengthMeter
                    required
                  />
                </FormField>

                <FormField
                  label="Konfirmasi Password Baru"
                  htmlFor="confirm-new-password"
                  required
                  error={resetTouched ? resetConfirmError : undefined}
                  helperText="Ulangi password baru untuk verifikasi"
                >
                  <PasswordInput
                    id="confirm-new-password"
                    placeholder="Ulangi password baru di atas"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setResetTouched(true);
                    }}
                    onBlur={() => setResetTouched(true)}
                    required
                  />
                </FormField>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResetOpen(false)}
                className="rounded-xl h-9 px-4 text-xs font-medium border-border/50 hover:bg-muted/50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="rounded-xl h-9 px-4.5 gap-1.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Perbarui Password</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
