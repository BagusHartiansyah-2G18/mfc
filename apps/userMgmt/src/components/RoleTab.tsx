import { useState, useMemo, type FormEvent } from 'react';
import {
  Shield,
  Plus,
  Users,
  Lock,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Check,
  Edit3,
  Layers,
  FileText,
  Briefcase,
  CreditCard,
  Settings,
  BarChart3,
  Database,
  Search,
} from 'lucide-react';
import {
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
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Alert,
  AlertDescription,
  FormField,
  InputWithIcon,
  Combobox,
  TabNav,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@org/ui';
import { userMgmtStore } from '../store/user-mgmt-store';
import {
  ACTIONS,
  type Role,
  type User,
  type ModuleDefinition,
  type PermissionAction,
  type PermissionMatrix,
} from '../types/user-mgmt';

interface RoleTabProps {
  roles: Role[];
  users: User[];
  onSelectRoleForMatrix: (roleId: string) => void;
}

function renderModuleIcon(iconName?: string) {
  switch (iconName) {
    case 'Users':
      return <Users className="h-4 w-4 text-primary shrink-0" />;
    case 'Shield':
      return <Shield className="h-4 w-4 text-primary shrink-0" />;
    case 'Briefcase':
      return <Briefcase className="h-4 w-4 text-primary shrink-0" />;
    case 'CreditCard':
      return <CreditCard className="h-4 w-4 text-primary shrink-0" />;
    case 'FileText':
      return <FileText className="h-4 w-4 text-primary shrink-0" />;
    case 'Settings':
      return <Settings className="h-4 w-4 text-primary shrink-0" />;
    case 'BarChart3':
      return <BarChart3 className="h-4 w-4 text-primary shrink-0" />;
    case 'Database':
      return <Database className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <Layers className="h-4 w-4 text-primary shrink-0" />;
  }
}

export function RoleTab({ roles, users, onSelectRoleForMatrix }: RoleTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [presetTemplate, setPresetTemplate] = useState('dev');
  const [modSearch, setModSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Matrix wewenang untuk form role
  const modules = useMemo(() => userMgmtStore.getModules(), [isAddOpen]);

  const filteredModules = useMemo(() => {
    if (!modSearch.trim()) return modules;
    const q = modSearch.toLowerCase();
    return modules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q)
    );
  }, [modules, modSearch]);

  const createInitialMatrix = (mods: ModuleDefinition[], preset: 'empty' | 'full' | 'readonly' | 'dev'): PermissionMatrix => {
    const matrix: PermissionMatrix = {};
    mods.forEach((m) => {
      if (preset === 'full') {
        matrix[m.key] = { view: true, create: true, edit: true, delete: true };
      } else if (preset === 'readonly') {
        matrix[m.key] = { view: true, create: false, edit: false, delete: false };
      } else if (preset === 'dev') {
        const isProtected = m.key === 'billing' || m.key === 'audit_logs';
        matrix[m.key] = {
          view: true,
          create: !isProtected,
          edit: !isProtected,
          delete: m.key === 'projects',
        };
      } else {
        matrix[m.key] = { view: false, create: false, edit: false, delete: false };
      }
    });
    return matrix;
  };

  const [roleMatrix, setRoleMatrix] = useState<PermissionMatrix>(() =>
    createInitialMatrix(modules, 'dev')
  );

  const getUserCountForRole = (roleId: string) => {
    return users.filter((u) => u.roleId === roleId).length;
  };

  const handleOpenAdd = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setPresetTemplate('dev');
    setModSearch('');
    setRoleMatrix(createInitialMatrix(modules, 'dev'));
    setActiveTab('info');
    setErrorMessage('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setPresetTemplate('');
    setModSearch('');
    setRoleMatrix(userMgmtStore.getRolePermissions(role.id));
    setActiveTab('info');
    setErrorMessage('');
    setIsAddOpen(true);
  };

  const handleTogglePerm = (modKey: string, act: PermissionAction) => {
    setRoleMatrix((prev) => ({
      ...prev,
      [modKey]: {
        ...(prev[modKey] || { view: false, create: false, edit: false, delete: false }),
        [act]: !prev[modKey]?.[act],
      },
    }));
  };

  const handleToggleRow = (modKey: string) => {
    setRoleMatrix((prev) => {
      const current = prev[modKey] || { view: false, create: false, edit: false, delete: false };
      const allSelected = current.view && current.create && current.edit && current.delete;
      const targetState = !allSelected;
      return {
        ...prev,
        [modKey]: {
          view: targetState,
          create: targetState,
          edit: targetState,
          delete: targetState,
        },
      };
    });
  };

  const handleToggleCol = (act: PermissionAction) => {
    setRoleMatrix((prev) => {
      const allChecked = modules.every((m) => prev[m.key]?.[act]);
      const targetState = !allChecked;
      const next: PermissionMatrix = { ...prev };
      modules.forEach((m) => {
        next[m.key] = {
          ...(next[m.key] || { view: false, create: false, edit: false, delete: false }),
          [act]: targetState,
        };
      });
      return next;
    });
  };

  const handleApplyPreset = (preset: 'empty' | 'full' | 'readonly' | 'dev') => {
    setRoleMatrix(createInitialMatrix(modules, preset));
  };

  const handleSaveRole = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama role wajib diisi.');
      setActiveTab('info');
      return;
    }

    try {
      if (editingRole) {
        userMgmtStore.updateRole(
          editingRole.id,
          { name: name.trim(), description: description.trim() },
          roleMatrix
        );
        setSuccessMessage(`Role "${name}" dan wewenangnya berhasil diperbarui.`);
      } else {
        userMgmtStore.addRole(name.trim(), description.trim(), roleMatrix);
        setSuccessMessage(`Role baru "${name}" dan matriks wewenang berhasil disimpan.`);
      }
      setIsAddOpen(false);
      setEditingRole(null);
      setName('');
      setDescription('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan role');
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      alert('Role sistem terlindungi dan tidak dapat dihapus.');
      return;
    }
    const count = getUserCountForRole(role.id);
    if (count > 0) {
      alert(
        `Role "${role.name}" masih memiliki ${count} pengguna. Pindahkan pengguna terlebih dahulu sebelum menghapus role.`
      );
      return;
    }

    if (window.confirm(`Hapus role "${role.name}" secara permanen?`)) {
      try {
        userMgmtStore.deleteRole(role.id);
        setSuccessMessage(`Role "${role.name}" telah dihapus.`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Gagal menghapus role');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Notifikasi Sukses */}
      {successMessage && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-2xl shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <AlertDescription className="text-xs font-semibold">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Header Bar Panel */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xs p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Daftar Role Akses Sistem
            </h3>
            <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2 rounded-full">
              {roles.length} Role
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Role mengelompokkan izin akses dan wewenang untuk berbagai tingkatan anggota tim dan klien eksternal.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="h-9 gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-[0.98] font-semibold text-xs rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary/95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Role Baru</span>
        </Button>
      </div>

      {/* Grid Kartu Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const count = getUserCountForRole(role.id);
          return (
            <Card
              key={role.id}
              className="relative flex flex-col justify-between rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {role.name}
                      </CardTitle>
                      {role.isSystem ? (
                        <span className="text-[10px] py-0.5 px-2 gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium inline-flex items-center">
                          <Lock className="h-2.5 w-2.5" />
                          <span>System</span>
                        </span>
                      ) : (
                        <span className="text-[10px] py-0.5 px-2 rounded-full text-muted-foreground border border-border/60 font-medium inline-flex items-center">
                          Custom
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {role.description || 'Tidak ada deskripsi peran yang ditetapkan.'}
                    </CardDescription>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary/20 transition-all duration-200">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0">
                <div className="flex items-center justify-between border-t border-border/40 pt-3.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{count} Pengguna Aktif</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                      onClick={() => onSelectRoleForMatrix(role.id)}
                    >
                      <Sliders className="h-3.5 w-3.5 text-primary" />
                      <span>Atur Permission</span>
                    </Button>

                    {!role.isSystem && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Role & Wewenang"
                          onClick={() => handleOpenEdit(role)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Hapus Role"
                          onClick={() => handleDeleteRole(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL MODERN: TAMBAH / EDIT ROLE & FORM MODUL & WEWENANG                  */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border/40 shadow-2xl shadow-primary/5 dark:shadow-black/50">
          {/* Header Banner Selaras dengan Form Tambah Pengguna */}
          <div className="bg-gradient-to-b from-primary/8 via-primary/[0.02] to-transparent px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-2xs">
                {editingRole ? <ShieldCheck className="h-5 w-5" /> : <ShieldPlus className="h-5 w-5" />}
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                  {editingRole ? `Ubah Data Role: ${editingRole.name}` : 'Tambah Role & Hak Akses Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 leading-relaxed mt-0.5">
                  Tentukan identitas peran baru dan konfigurasikan form modul & wewenang akses granular (View, Create, Edit, Delete).
                </DialogDescription>
              </div>
            </div>

            {/* Segmented Tab Navigasi Form */}
            <div className="mt-5 pt-0.5">
              <TabNav
                items={[
                  { id: 'info', label: '1. Informasi Role', icon: <Shield className="h-3.5 w-3.5" /> },
                  { id: 'permissions', label: '2. Modul & Wewenang', icon: <Sliders className="h-3.5 w-3.5" /> },
                ]}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'info' | 'permissions')}
                variant="segmented"
                size="sm"
                fullWidth
              />
            </div>
          </div>

          <form onSubmit={handleSaveRole} className="flex flex-col">
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
              {errorMessage && (
                <Alert variant="destructive" className="py-2.5 px-3.5 rounded-xl text-xs animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {activeTab === 'info' ? (
                <div className="space-y-4 animate-in fade-in-50">
                  <FormField
                    label="Nama Role Hak Akses"
                    htmlFor="roleName"
                    required
                    helperText="Contoh: QA Automation Lead, Security Auditor, Data Analyst"
                  >
                    <InputWithIcon
                      id="roleName"
                      icon={<Shield className="h-4 w-4 text-primary shrink-0" />}
                      placeholder="Masukkan nama role..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Deskripsi Tugas & Cakupan Wewenang"
                    htmlFor="roleDesc"
                    helperText="Jelaskan tanggung jawab utama dan batasan wewenang pemegang role ini."
                  >
                    <Textarea
                      id="roleDesc"
                      placeholder="Contoh: Bertanggung jawab atas verifikasi pengujian sistem dan peninjauan log keamanan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="rounded-xl resize-none text-xs"
                    />
                  </FormField>

                  {/* Template Preset Wewenang Awal dengan Searchable Combobox */}
                  <div className="space-y-2">
                    <FormField
                      label="Template Preset Wewenang Awal"
                      helperText="Pilih template wewenang otomatis untuk mengisi hak akses pada Tab 2 secara instan"
                    >
                      <Combobox
                        options={[
                          { value: 'full', label: 'Akses Penuh (Full Access ke Seluruh Modul)', icon: <Sparkles className="h-3.5 w-3.5 text-primary" /> },
                          { value: 'dev', label: 'Tim Teknis / Dev (Pengembangan & Delivery)', icon: <Sliders className="h-3.5 w-3.5 text-sky-500" /> },
                          { value: 'readonly', label: 'Viewer / Audit (Hanya Lihat / Read Only)', icon: <Shield className="h-3.5 w-3.5 text-amber-500" /> },
                          { value: 'empty', label: 'Kosongkan (Belum Ada Wewenang)', icon: <Lock className="h-3.5 w-3.5 text-muted-foreground" /> },
                        ]}
                        value={presetTemplate}
                        onValueChange={(val) => {
                          setPresetTemplate(val);
                          handleApplyPreset(val as 'full' | 'dev' | 'readonly' | 'empty');
                        }}
                        placeholder="Pilih template wewenang (opsional)..."
                        searchPlaceholder="Cari template wewenang..."
                      />
                    </FormField>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-muted-foreground font-medium">Pintasan Cepat:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPresetTemplate('full');
                          handleApplyPreset('full');
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md border border-border/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-muted-foreground"
                      >
                        Akses Penuh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPresetTemplate('dev');
                          handleApplyPreset('dev');
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md border border-border/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-muted-foreground"
                      >
                        Tim Teknis
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPresetTemplate('readonly');
                          handleApplyPreset('readonly');
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md border border-border/60 hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
                      >
                        Viewer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPresetTemplate('empty');
                          handleApplyPreset('empty');
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-md border border-border/60 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer text-muted-foreground"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB 2: FITUR FORM MODUL & WEWENANG */
                <div className="space-y-3.5 animate-in fade-in-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-primary" />
                        <span>Konfigurasi Wewenang Granular per Modul</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Centang hak akses yang diizinkan untuk setiap modul sistem di bawah ini.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset('full')}
                        className="h-7 px-2 text-[10px] rounded-md border-border/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        Semua Penuh
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset('readonly')}
                        className="h-7 px-2 text-[10px] rounded-md border-border/60 hover:bg-muted transition-colors cursor-pointer"
                      >
                        Hanya Lihat
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset('empty')}
                        className="h-7 px-2 text-[10px] rounded-md border-border/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                      >
                        Kosongkan
                      </Button>
                    </div>
                  </div>

                  {/* Filter Pencarian Modul Form */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari modul dalam form..."
                      value={modSearch}
                      onChange={(e) => setModSearch(e.target.value)}
                      className="pl-8.5 h-8 text-xs rounded-xl bg-background/80"
                    />
                  </div>

                  {/* Tabel Form Modul & Wewenang */}
                  <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                    <Table containerClassName="border-0 rounded-none shadow-none max-h-72 overflow-y-auto">
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
                          <TableHead className="py-2.5 px-4 text-xs font-semibold text-foreground min-w-[200px]">
                            Modul & Wewenang
                          </TableHead>
                          {ACTIONS.map((act) => {
                            const allChecked = modules.every((m) => roleMatrix[m.key]?.[act.key]);
                            return (
                              <TableHead key={act.key} className="py-2.5 px-3 text-center min-w-[75px]">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                                    {act.key}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCol(act.key)}
                                    className="text-[9px] text-primary hover:underline font-medium cursor-pointer"
                                  >
                                    {allChecked ? 'Batal' : 'Semua'}
                                  </button>
                                </div>
                              </TableHead>
                            );
                          })}
                          <TableHead className="py-2.5 px-3 text-center min-w-[80px] text-[10px] font-semibold text-muted-foreground">
                            PILIH BARIS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredModules.map((mod) => {
                          const rowPerms = roleMatrix[mod.key] || {
                            view: false,
                            create: false,
                            edit: false,
                            delete: false,
                          };
                          const allRowChecked =
                            rowPerms.view && rowPerms.create && rowPerms.edit && rowPerms.delete;

                          return (
                            <TableRow key={mod.key} className="hover:bg-muted/20 border-b border-border/30">
                              <TableCell className="py-2.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                                    {renderModuleIcon(mod.iconName)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-foreground text-xs leading-tight truncate">
                                      {mod.label}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                                      {mod.description}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              {ACTIONS.map((act) => (
                                <TableCell key={act.key} className="py-2.5 px-3 text-center">
                                  <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                    <input
                                      type="checkbox"
                                      checked={!!rowPerms[act.key]}
                                      onChange={() => handleTogglePerm(mod.key, act.key)}
                                      className="h-4 w-4 rounded-md border-border text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer accent-primary"
                                    />
                                  </label>
                                </TableCell>
                              ))}

                              <TableCell className="py-2.5 px-3 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleRow(mod.key)}
                                  className="h-6 px-2 text-[10px] font-medium text-primary hover:bg-primary/10 rounded-md"
                                >
                                  {allRowChecked ? 'Batal' : 'Semua'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal dengan Navigasi Antar Tab */}
            <DialogFooter className="bg-muted/25 px-6 py-3.5 border-t border-border/40 flex flex-row items-center justify-between gap-2">
              <div>
                {activeTab === 'permissions' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('info')}
                    className="h-9 gap-1.5 text-xs rounded-xl"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali ke Info</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                    className="h-9 text-xs rounded-xl border-border/60"
                  >
                    Batal
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'info' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('permissions')}
                      className="h-9 gap-1.5 text-xs rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <span>Lanjut ke Modul & Wewenang</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 gap-1.5 font-semibold text-xs rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary/95 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingRole ? 'Simpan Perubahan' : 'Simpan Role'}</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 gap-1.5 font-semibold text-xs rounded-xl px-5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{editingRole ? 'Simpan Role & Wewenang' : 'Simpan Role & Wewenang Baru'}</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
