import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  Shield,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Layers,
  Sliders,
  Plus,
  Trash2,
  Briefcase,
  Users,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  Database,
  HelpCircle,
  FolderGit2,
  AlertTriangle,
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
  Alert,
  AlertDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Combobox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FormField,
  InputWithIcon,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@org/ui';
import { userMgmtStore } from '../store/user-mgmt-store';
import {
  SYSTEM_MODULES,
  ACTIONS,
  type Role,
  type PermissionModule,
  type PermissionAction,
  type PermissionMatrix,
  type ModuleDefinition,
} from '../types/user-mgmt';

interface PermissionMatrixTabProps {
  roles: Role[];
  initialRoleId?: string;
}

const AVAILABLE_ICONS = [
  { name: 'Layers', label: 'Layers', icon: Layers },
  { name: 'BarChart3', label: 'Grafik & Laporan', icon: BarChart3 },
  { name: 'Database', label: 'Database & Data', icon: Database },
  { name: 'FolderGit2', label: 'Repositori & Proyek', icon: FolderGit2 },
  { name: 'CreditCard', label: 'Billing & Keuangan', icon: CreditCard },
  { name: 'FileText', label: 'Dokumen & Audit', icon: FileText },
  { name: 'Users', label: 'Pengguna & SDM', icon: Users },
  { name: 'Settings', label: 'Pengaturan', icon: Settings },
  { name: 'Shield', label: 'Keamanan', icon: Shield },
];

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
    case 'FolderGit2':
      return <FolderGit2 className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <Layers className="h-4 w-4 text-primary shrink-0" />;
  }
}

export function PermissionMatrixTab({ roles, initialRoleId }: PermissionMatrixTabProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    initialRoleId ?? roles[0]?.id ?? 'role-superadmin'
  );
  const [matrix, setMatrix] = useState<PermissionMatrix>(() =>
    userMgmtStore.getRolePermissions(selectedRoleId)
  );
  const [modules, setModules] = useState<ModuleDefinition[]>(() => userMgmtStore.getModules());
  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Tambah Modul & Wewenang State
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [modLabel, setModLabel] = useState('');
  const [modKey, setModKey] = useState('');
  const [modDescription, setModDescription] = useState('');
  const [modIcon, setModIcon] = useState('Layers');
  const [defaultAccess, setDefaultAccess] = useState(false);
  const [moduleError, setModuleError] = useState('');
  const [moduleSuccess, setModuleSuccess] = useState('');

  // Sinkronkan matriks saat selectedRoleId berubah
  useEffect(() => {
    setMatrix(userMgmtStore.getRolePermissions(selectedRoleId));
    setHasChanges(false);
  }, [selectedRoleId]);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) ?? roles[0];
  }, [roles, selectedRoleId]);

  // Handler toggle single permission
  const handleToggle = (mod: PermissionModule, act: PermissionAction) => {
    setMatrix((prev) => {
      const next = {
        ...prev,
        [mod]: {
          ...(prev[mod] || { view: false, create: false, edit: false, delete: false }),
          [act]: !prev[mod]?.[act],
        },
      };
      setHasChanges(true);
      return next;
    });
  };

  // Handler toggle "Pilih Semua" per modul (Row Select All)
  const handleToggleRow = (mod: PermissionModule) => {
    setMatrix((prev) => {
      const currentRow = prev[mod] || { view: false, create: false, edit: false, delete: false };
      const allSelected = currentRow.view && currentRow.create && currentRow.edit && currentRow.delete;
      const targetState = !allSelected;

      const next = {
        ...prev,
        [mod]: {
          view: targetState,
          create: targetState,
          edit: targetState,
          delete: targetState,
        },
      };
      setHasChanges(true);
      return next;
    });
  };

  // Handler toggle "Pilih Semua" per kolom aksi (Column Select All)
  const handleToggleColumn = (actKey: PermissionAction) => {
    setMatrix((prev) => {
      const allChecked = modules.every((m) => prev[m.key]?.[actKey]);
      const targetState = !allChecked;

      const next = { ...prev };
      modules.forEach((m) => {
        next[m.key] = {
          ...(next[m.key] || { view: false, create: false, edit: false, delete: false }),
          [actKey]: targetState,
        };
      });
      setHasChanges(true);
      return next;
    });
  };

  // Preset: Full Access
  const handlePresetFull = () => {
    const next: PermissionMatrix = {};
    modules.forEach((m) => {
      next[m.key] = { view: true, create: true, edit: true, delete: true };
    });
    setMatrix(next);
    setHasChanges(true);
  };

  // Preset: Read Only
  const handlePresetReadOnly = () => {
    const next: PermissionMatrix = {};
    modules.forEach((m) => {
      next[m.key] = { view: true, create: false, edit: false, delete: false };
    });
    setMatrix(next);
    setHasChanges(true);
  };

  // Preset: Revoke All
  const handlePresetRevokeAll = () => {
    const next: PermissionMatrix = {};
    modules.forEach((m) => {
      next[m.key] = { view: false, create: false, edit: false, delete: false };
    });
    setMatrix(next);
    setHasChanges(true);
  };

  // Simpan perubahan matriks
  const handleSave = () => {
    userMgmtStore.saveRolePermissions(selectedRoleId, matrix);
    setHasChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  // Buka Form Tambah Modul & Wewenang
  const handleOpenAddModule = () => {
    setModLabel('');
    setModKey('');
    setModDescription('');
    setModIcon('Layers');
    setDefaultAccess(false);
    setModuleError('');
    setIsAddModuleOpen(true);
  };

  // Handler Simpan Modul Baru
  const handleCreateModule = (e: FormEvent) => {
    e.preventDefault();
    setModuleError('');

    if (!modLabel.trim()) {
      setModuleError('Nama modul wajib diisi.');
      return;
    }

    try {
      const created = userMgmtStore.addModule({
        label: modLabel.trim(),
        key: modKey.trim() || undefined,
        description: modDescription.trim() || undefined,
        iconName: modIcon,
        defaultAccess,
      });

      setModules(userMgmtStore.getModules());
      setMatrix(userMgmtStore.getRolePermissions(selectedRoleId));
      setIsAddModuleOpen(false);
      setModuleSuccess(`Modul & wewenang "${created.label}" berhasil ditambahkan ke sistem.`);
      setTimeout(() => setModuleSuccess(''), 4500);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : 'Gagal menambahkan modul');
    }
  };

  // Handler Hapus Modul Kustom
  const handleDeleteCustomModule = (key: string, label: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus modul "${label}" dari sistem? Seluruh wewenang terkait modul ini akan dihapus.`)) {
      try {
        userMgmtStore.deleteModule(key);
        setModules(userMgmtStore.getModules());
        setMatrix(userMgmtStore.getRolePermissions(selectedRoleId));
        setModuleSuccess(`Modul "${label}" telah dihapus.`);
        setTimeout(() => setModuleSuccess(''), 4000);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Gagal menghapus modul');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Sukses Matriks & Modul */}
      {savedSuccess && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-2xl shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <AlertDescription className="text-xs font-semibold">
            Matriks izin hak akses untuk role &quot;{activeRole?.name}&quot; berhasil disimpan secara permanen.
          </AlertDescription>
        </Alert>
      )}

      {moduleSuccess && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-2xl shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <AlertDescription className="text-xs font-semibold">{moduleSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Control Bar: Pilih Role & Preset Akses */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xs p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              Role Sasaran:
            </span>
            <div className="w-72 sm:w-80 min-w-[260px]">
              <Combobox
                options={roles.map((r) => ({
                  value: r.id,
                  label: `${r.name} ${r.isSystem ? '(System)' : ''}`,
                  icon: <Shield className="h-3.5 w-3.5 text-primary" />,
                }))}
                value={selectedRoleId}
                onValueChange={(val) => setSelectedRoleId(val)}
                placeholder="Pilih Role..."
                searchPlaceholder="Cari role sasaran..."
              />
            </div>

            {activeRole?.isSystem && (
              <span className="text-[11px] py-1 px-2.5 gap-1.5 text-muted-foreground bg-muted/40 rounded-full border border-border/50 inline-flex items-center whitespace-nowrap">
                <Lock className="h-3 w-3 text-primary" />
                <span>Protected System Role</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Presets & Save Button */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          <div className="inline-flex items-center rounded-xl bg-muted/40 p-1 border border-border/50 text-xs">
            <span className="text-[11px] font-medium text-muted-foreground px-2">Preset:</span>
            <button
              type="button"
              onClick={handlePresetFull}
              className="px-2.5 py-1 text-xs font-medium rounded-lg hover:text-foreground text-muted-foreground hover:bg-background/80 transition-all cursor-pointer"
            >
              Full Access
            </button>
            <button
              type="button"
              onClick={handlePresetReadOnly}
              className="px-2.5 py-1 text-xs font-medium rounded-lg hover:text-foreground text-muted-foreground hover:bg-background/80 transition-all cursor-pointer"
            >
              Read Only
            </button>
            <button
              type="button"
              onClick={handlePresetRevokeAll}
              className="px-2.5 py-1 text-xs font-medium rounded-lg hover:text-destructive text-muted-foreground hover:bg-destructive/10 transition-all cursor-pointer"
            >
              Kosongkan
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              "h-9 gap-1.5 font-semibold text-xs rounded-xl shadow-xs px-4 transition-all shrink-0 cursor-pointer",
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md"
                : "bg-muted/40 text-muted-foreground/60 border border-border/40 opacity-70 cursor-not-allowed"
            )}
          >
            <Check className="h-4 w-4" />
            <span>{hasChanges ? 'Simpan Matriks' : 'Tersimpan'}</span>
          </Button>
        </div>
      </div>

      {/* Tabel Matriks Granular: Modul x Action */}
      <Card className="rounded-2xl border border-border/50 shadow-xs overflow-hidden bg-card">
        <CardHeader className="px-5 py-4 border-b border-border/40 bg-card/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Matriks Akses Granular Role: {activeRole?.name}</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] py-0.5 px-2 rounded-full font-semibold">
                  {modules.length} Modul Terdaftar
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Klik kotak centang individual, atau gunakan toggle per modul / per aksi untuk pengaturan cepat.
              </CardDescription>
            </div>

            <Button
              onClick={handleOpenAddModule}
              className="h-9 gap-1.5 font-semibold text-xs rounded-xl shadow-xs px-4 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Modul & Wewenang</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table containerClassName="border-0 rounded-none shadow-none">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
                <TableHead className="py-3 px-5 min-w-[260px] text-xs font-semibold text-foreground">
                  Modul & Wewenang
                </TableHead>
                {ACTIONS.map((act) => {
                  const isAllChecked = modules.every((m) => matrix[m.key]?.[act.key]);
                  return (
                    <TableHead key={act.key} className="py-3 px-4 text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                          {act.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleColumn(act.key)}
                          className="text-[10px] text-primary/80 hover:text-primary hover:underline font-medium cursor-pointer transition-colors"
                          title={`Toggle seluruh kolom ${act.label}`}
                        >
                          {isAllChecked ? 'Batalkan Semua' : 'Pilih Semua'}
                        </button>
                      </div>
                    </TableHead>
                  );
                })}
                <TableHead className="py-3 px-4 text-center min-w-[110px] text-xs font-semibold text-foreground">
                  Pilih Baris
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/40">
              {modules.map((mod) => {
                const modRow = matrix[mod.key] || { view: false, create: false, edit: false, delete: false };
                const isRowAllChecked = modRow.view && modRow.create && modRow.edit && modRow.delete;
                const isSystemMod = SYSTEM_MODULES.some((m) => m.key === mod.key);

                return (
                  <TableRow key={mod.key} className="hover:bg-muted/30 transition-colors">
                    {/* Modul Info */}
                    <TableCell className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                          {renderModuleIcon(mod.iconName)}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs">{mod.label}</span>
                            {!isSystemMod && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-muted-foreground border-border/50">
                                Kustom
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                            {mod.description}
                          </div>
                        </div>
                        {!isSystemMod && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg ml-auto shrink-0 transition-colors"
                            title="Hapus Modul Kustom Ini"
                            onClick={() => handleDeleteCustomModule(mod.key, mod.label)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    {/* Kolom Tiap Aksi (View, Create, Edit, Delete) */}
                    {ACTIONS.map((act) => {
                      const checked = !!modRow[act.key];
                      return (
                        <TableCell key={act.key} className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggle(mod.key, act.key)}
                              className="h-4 w-4 rounded-md border-border text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer accent-primary"
                            />
                          </label>
                        </TableCell>
                      );
                    })}

                    {/* Baris Toggle "Pilih Semua" (Row Toggle) */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRow(mod.key)}
                        className={cn(
                          "h-7 px-2.5 text-[11px] rounded-lg transition-all font-medium border-border/60",
                          isRowAllChecked
                            ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                            : "text-primary hover:bg-primary/10 border-primary/30"
                        )}
                      >
                        {isRowAllChecked ? (
                          <span className="flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" /> Reset
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> Semua
                          </span>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: FORM TAMBAH MODUL & WEWENANG SISTEM                                */}
      {/* ========================================================================= */}
      <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border/40 shadow-2xl shadow-primary/5 dark:shadow-black/50">
          <div className="bg-gradient-to-b from-primary/8 via-primary/[0.02] to-transparent px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-2xs">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                  Form Tambah Modul & Wewenang
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 leading-relaxed mt-0.5">
                  Daftarkan modul sistem baru ke dalam arsitektur RBAC untuk mengatur hak akses izin granular (View, Create, Edit, Delete).
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateModule} className="p-6 space-y-3.5 text-xs">
            {moduleError && (
              <Alert variant="destructive" className="py-2.5 px-3.5 rounded-xl text-xs animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription className="font-medium">{moduleError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField
                label="Nama Modul Sistem"
                htmlFor="modLabel"
                required
                helperText="Contoh: Laporan & Analitik, Tiket Bantuan"
              >
                <InputWithIcon
                  id="modLabel"
                  icon={<Layers className="h-4 w-4 text-primary shrink-0" />}
                  placeholder="Masukkan nama modul baru..."
                  value={modLabel}
                  onChange={(e) => {
                    setModLabel(e.target.value);
                    if (!modKey || modKey === modLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
                      setModKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                    }
                  }}
                  required
                />
              </FormField>

              <FormField
                label="Kode Identifier Modul (Key)"
                htmlFor="modKey"
                helperText="Kode unik modul untuk sistem dan matrix."
              >
                <Input
                  id="modKey"
                  placeholder="misal: laporan_analitik"
                  value={modKey}
                  onChange={(e) => setModKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="font-mono text-xs rounded-xl"
                />
              </FormField>
            </div>

            <FormField
              label="Pilihan Ikon Modul"
              helperText="Pilih atau cari ikon visual representatif untuk modul ini"
            >
              <Combobox
                options={AVAILABLE_ICONS.map((item) => ({
                  value: item.name,
                  label: item.label,
                  icon: <item.icon className="h-4 w-4 text-primary" />,
                }))}
                value={modIcon}
                onValueChange={setModIcon}
                placeholder="Pilih ikon modul..."
                searchPlaceholder="Cari ikon (cth: Laporan, Database, Keuangan)..."
              />
            </FormField>

            <FormField
              label="Deskripsi Cakupan Modul"
              htmlFor="modDesc"
              helperText="Jelaskan jenis data dan fungsi yang diatur oleh modul ini."
            >
              <Textarea
                id="modDesc"
                placeholder="Contoh: Mengatur akses laporan performa penjualan, ekspor data CSV/PDF, dan analitik tim..."
                value={modDescription}
                onChange={(e) => setModDescription(e.target.value)}
                rows={2}
                className="rounded-xl resize-none text-xs"
              />
            </FormField>

            {/* Opsi Hak Akses Default */}
            <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaultAccess}
                  onChange={(e) => setDefaultAccess(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-border text-primary focus:ring-ring accent-primary cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground text-xs block">
                    Beri Hak Akses Awal untuk Seluruh Role
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Jika dicentang, seluruh role akan otomatis mendapatkan izin View/Create/Edit pada modul baru ini.
                  </p>
                </div>
              </label>
            </div>

            <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModuleOpen(false)}
                className="h-9 text-xs rounded-xl border-border/60"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 gap-1.5 font-semibold text-xs rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary/95 shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Simpan Modul & Wewenang</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
