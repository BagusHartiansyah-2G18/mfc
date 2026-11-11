import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  StatusBadge,
  TabNav,
  type TabNavItem,
  InputWithIcon,
  InputWithBtnPopUp,
  PasswordInput,
  FormField,
  SelectField,
  Alert,
  AlertTitle,
  AlertDescription,
  Progress,
  Skeleton,
  Avatar,
  AvatarFallback,
  DataTable,
  type ColumnDef,
} from "@org/ui";
import {
  Sparkles,
  Layers,
  ShieldCheck,
  Code2,
  LayoutGrid,
  Search,
  ExternalLink,
  Box,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  SlidersHorizontal,
} from "lucide-react";

export interface OverviewPageProps {
  basePath?: string;
}

type CatalogModule = {
  id: string;
  name: string;
  category: string;
  version: string;
  status: "active" | "inactive" | "pending" | "suspended";
  apiKey: string;
};

const CATALOG_DATA: CatalogModule[] = [
  { id: "MFE-01", name: "Authentication Gateway", category: "Security", version: "v2.5.0", status: "active", apiKey: "sk_live_auth_••••••••" },
  { id: "MFE-02", name: "User Identity & RBAC", category: "Access Control", version: "v3.1.0", status: "active", apiKey: "sk_live_user_••••••••" },
  { id: "MFE-03", name: "Audit Trail & Compliance", category: "Governance", version: "v1.4.0", status: "pending", apiKey: "sk_live_audt_••••••••" },
  { id: "MFE-04", name: "Billing & Invoicing Engine", category: "Finance", version: "v2.0.2", status: "inactive", apiKey: "sk_live_bill_••••••••" },
  { id: "MFE-05", name: "Component UI Playground", category: "Design System", version: "v2.5.0", status: "active", apiKey: "sk_live_comp_••••••••" },
];

export function OverviewPage({ basePath = "" }: OverviewPageProps) {
  const prefix = basePath ? basePath.replace(/\/$/, "") : "";
  const [activeTab, setActiveTab] = useState("all");
  const [demoSearch, setDemoSearch] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [selectedGender, setSelectedGender] = useState("Laki-laki");

  const tabItems: TabNavItem[] = [
    { id: "all", label: "Semua Komponen", icon: <Layers className="h-3.5 w-3.5" />, badge: "40+" },
    { id: "inputs", label: "Forms & Inputs", icon: <Code2 className="h-3.5 w-3.5" />, badge: 12 },
    { id: "data", label: "Data & Tables", icon: <Database className="h-3.5 w-3.5" />, badge: 6 },
    { id: "layout", label: "Shell & Layouts", icon: <LayoutGrid className="h-3.5 w-3.5" />, badge: 4 },
  ];

  const columns: ColumnDef<CatalogModule, any>[] = [
    {
      accessorKey: "name",
      header: "Nama Layanan / Modul",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-foreground text-xs">{row.original.name}</div>
          <div className="text-[11px] text-muted-foreground font-mono">{row.original.id}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: "version",
      header: "Versi",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.version}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status Operasional",
      cell: ({ row }) => <StatusBadge status={row.original.status} pulse={row.original.status === "active"} />,
    },
    {
      accessorKey: "apiKey",
      header: "Kredensial API Key",
      cell: () => <PasswordInput displayMaskedOnly />,
    },
  ];

  const handleCopyDemoToken = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("mfc_live_token_7721998");
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Component UI</h1>
            <Badge variant="secondary" className="text-[10px] font-semibold py-0.5">
              @org/ui Enterprise v2.5
            </Badge>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
              Tailwind CSS v4
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Playground komponen @org/ui — contoh pakai nyata.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
            <Link to={prefix ? `${prefix}/forms` : "/forms"}>
              <span>Buka Forms & Inputs</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
            <Link to={prefix ? `${prefix}/data` : "/data"}>
              <span>Buka Data Table</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link to={prefix ? `${prefix}/widgets` : "/widgets"}>
              <span>Buka Widgets</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ARSITEKTUR & VALUE PROPOSITION                                         */}
      {/* ========================================================================= */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Arsitektur Terpusat</span>
            <Box className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">100% Monorepo</div>
          <p className="text-[11px] text-muted-foreground">
            Semua komponen dikelola di <code>@org/ui</code> tanpa duplikasi kode di host.
          </p>
        </Card>

        <Card className="p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Input Terspesialisasi</span>
            <Code2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">Advanced Inputs</div>
          <p className="text-[11px] text-muted-foreground">
            <code>InputWithIcon</code>, <code>InputWithBtnPopUp</code>, <code>SelectField</code>, & <code>PasswordInput</code>.
          </p>
        </Card>

        <Card className="p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Sistem Layout</span>
            <LayoutGrid className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">Dash & Public</div>
          <p className="text-[11px] text-muted-foreground">
            Layout terstandar <code>dashx1</code> (Dashboard Shell) & <code>publicx1</code> (Landing Promosi).
          </p>
        </Card>

        <Card className="p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Keamanan & Akses</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-foreground">Enkripsi & Masking</div>
          <p className="text-[11px] text-muted-foreground">
            Password masked secara kriptografis, indikator kekuatan sandi real-time.
          </p>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. SHOWCASE: STATUS BADGES & TABNAV                                       */}
      {/* ========================================================================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              StatusBadge Showcase (@org/ui)
            </CardTitle>
            <CardDescription className="text-xs">
              Indikator status universal dengan animasi dot & pulsing glow otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status="active" label="Aktif (Pulse)" pulse />
              <StatusBadge status="inactive" label="Nonaktif" />
              <StatusBadge status="suspended" label="Ditangguhkan" />
              <StatusBadge status="pending" label="Menunggu Persetujuan" />
            </div>
            <div className="rounded-md bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground select-all">
              {`<StatusBadge status="active" label="Aktif" pulse />`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              TabNav Showcase (@org/ui)
            </CardTitle>
            <CardDescription className="text-xs">
              Pengalih navigasi tab terpadu dengan varian segmented, pills, atau underline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <TabNav
              items={tabItems}
              activeId={activeTab}
              onChange={setActiveTab}
              variant="segmented"
            />
            <div className="rounded-md bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground select-all">
              {`<TabNav items={items} activeId={activeTab} onChange={setActiveTab} variant="segmented" />`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. SHOWCASE: SPECIALIZED FORM INPUTS (LIVE INTERACTIVE)                   */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Live Preview: Specialized Form Inputs (@org/ui)
              </CardTitle>
              <CardDescription className="text-xs">
                Komponen input mutakhir siap pakai untuk formulir enterprise berstandar tinggi.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
              <Link to={prefix ? `${prefix}/forms` : "/forms"}>
                <span>Lihat Semua Forms</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. InputWithIcon */}
            <FormField label="InputWithIcon (Clearable)" helperText="Mendukung search & clearable button">
              <InputWithIcon
                icon={<Search className="h-4 w-4" />}
                placeholder="Pencarian cepat..."
                value={demoSearch}
                onChange={(e) => setDemoSearch(e.target.value)}
                clearable
              />
            </FormField>

            {/* 2. InputWithBtnPopUp */}
            <FormField label="InputWithBtnPopUp" helperText="Aksi langsung salin ke clipboard">
              <InputWithBtnPopUp
                value="mfc_live_token_7721998"
                readOnly
                buttonIcon={copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                buttonLabel={copiedToken ? "Tersalin!" : "Salin"}
                buttonVariant="secondary"
                onButtonClick={handleCopyDemoToken}
              />
            </FormField>

            {/* 3. PasswordInput */}
            <FormField label="PasswordInput" helperText="Dilengkapi strength score & masked toggle">
              <PasswordInput
                defaultValue="MfcSecurity2026!"
                showStrengthMeter
              />
            </FormField>

            {/* 4. SelectField (Smart Radio Switch) */}
            <FormField label="SelectField (Smart Radio)" helperText="Otomatis Switch Radio saat opsi ≤ 2">
              <SelectField
                name="gender"
                options={[
                  { label: "Laki-laki", value: "Laki-laki" },
                  { label: "Perempuan", value: "Perempuan" },
                ]}
                value={selectedGender}
                onChange={setSelectedGender}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 5. SHOWCASE: FEEDBACK, ALERTS & PROGRESS                                  */}
      {/* ========================================================================= */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Alert & Feedback Components
            </CardTitle>
            <CardDescription className="text-xs">
              Pemberitahuan sistem terstandarisasi untuk status info, warning, dan destructive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle>Operasional MFE Normal</AlertTitle>
              <AlertDescription className="text-xs">
                Semua modul remote compUI dan userMgmt terhubung dan terisolasi dengan baik.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription className="text-xs">
                Percobaan login gagal terdeteksi pada IP 192.168.1.100. Audit trail telah dicatat.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Progress, Skeleton & Avatar Primitives
            </CardTitle>
            <CardDescription className="text-xs">
              Elemen pemuatan data asynchronous dan identitas visual pengguna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progres Build & Lint Monorepo</span>
                <span className="font-semibold text-primary font-mono">82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  SA
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Super Administrator</p>
                <p className="text-[11px] text-muted-foreground">admin@mfc-solutions.id • Role: Administrator</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-32 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 6. SHOWCASE: ENTERPRISE DATA TABLE PREVIEW                                */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="h-4 w-4 text-primary" />
            <span>Katalog Layanan & Modul Terpusat (Live <code>&lt;DataTable /&gt;</code>)</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
            <Link to={prefix ? `${prefix}/data` : "/data"}>
              <span>Eksplorasi Fitur Lengkap Data Table</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <DataTable<CatalogModule>
          data={CATALOG_DATA}
          columns={columns}
          getRowId={(r) => r.id}
          showSearch={true}
          searchPlaceholder="Cari modul atau kategori layanan..."
          pageSize={5}
        />
      </div>
    </div>
  );
}

export default OverviewPage;