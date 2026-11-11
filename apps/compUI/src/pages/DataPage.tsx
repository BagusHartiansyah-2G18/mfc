import { useState, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  // Centralized @org/ui components
  StatusBadge,
  PasswordInput,
  DataTable,
  type ColumnDef,
  type TableDensity,
  type TableVariant,
} from "@org/ui";
import {
  Plus,
  Trash2,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from "lucide-react";

type ServiceModule = {
  id: string;
  name: string;
  category: string;
  version: string;
  status: "active" | "inactive" | "pending";
  stock: number;
  apiKeyMasked: string;
  createdAt: string;
};

const SAMPLE_MODULES: ServiceModule[] = [
  { id: "mod-01", name: "Authentication Gateway", category: "Security", version: "v2.4.0", status: "active", stock: 12, apiKeyMasked: "sk_live_auth_••••••••", createdAt: "2026-01-15" },
  { id: "mod-02", name: "User Identity Service", category: "RBAC Core", version: "v3.1.2", status: "active", stock: 8, apiKeyMasked: "sk_live_user_••••••••", createdAt: "2026-02-10" },
  { id: "mod-03", name: "Billing & Invoicing Engine", category: "Finance", version: "v1.8.0", status: "pending", stock: 4, apiKeyMasked: "sk_live_bill_••••••••", createdAt: "2026-03-01" },
  { id: "mod-04", name: "Notification Broker (Kafka)", category: "Messaging", version: "v2.0.1", status: "active", stock: 24, apiKeyMasked: "sk_live_notif_•••••••", createdAt: "2026-03-12" },
  { id: "mod-05", name: "Audit Trail & Compliance", category: "Security", version: "v1.2.4", status: "inactive", stock: 2, apiKeyMasked: "sk_live_audit_•••••••", createdAt: "2026-03-18" },
  { id: "mod-06", name: "Component UI Microservice", category: "Frontend MFE", version: "v1.0.0", status: "active", stock: 16, apiKeyMasked: "sk_live_comp_••••••••", createdAt: "2026-04-02" },
  { id: "mod-07", name: "Analytics & Telemetry Pipeline", category: "Data Science", version: "v4.0.0", status: "active", stock: 32, apiKeyMasked: "sk_live_tele_••••••••", createdAt: "2026-04-10" },
  { id: "mod-08", name: "File Storage & CDN Proxy", category: "Infrastructure", version: "v2.1.0", status: "active", stock: 10, apiKeyMasked: "sk_live_cdn_•••••••••", createdAt: "2026-04-15" },
  { id: "mod-09", name: "Search & Vector Indexer", category: "AI & Search", version: "v0.9.5", status: "pending", stock: 6, apiKeyMasked: "sk_live_vec_•••••••••", createdAt: "2026-04-20" },
  { id: "mod-10", name: "Legacy ERP Connector", category: "Integration", version: "v1.0.2", status: "inactive", stock: 1, apiKeyMasked: "sk_live_erp_•••••••••", createdAt: "2026-04-25" },
];

export function DataPage() {
  const [density, setDensity] = useState<TableDensity>("default");
  const [variant, setVariant] = useState<TableVariant>("default");
  const [selectable, setSelectable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ServiceModule[]>([]);

  const handleRowSelectionChange = useCallback((selected: ServiceModule[]) => {
    setSelectedRows(selected);
  }, []);

  const columns: ColumnDef<ServiceModule, any>[] = [
    {
      accessorKey: "name",
      header: "Nama Modul & Deskripsi",
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
        <span className="font-mono text-xs">{row.original.version}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "apiKeyMasked",
      header: "Kredensial API Key",
      cell: () => <PasswordInput displayMaskedOnly />,
    },
    {
      accessorKey: "stock",
      header: "Kapasitas Node",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">{row.original.stock} instance</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Tgl Rilis",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.createdAt}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Data & Table Components</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sistem tabel data profesional enterprise berbasis <strong>@tanstack/react-table</strong>: pagination, sortable columns, client/server hybrid fetcher, selection & bulk actions, density variants, terpusat di <code>@org/ui</code>.
          </p>
        </div>
        <Badge variant="outline" className="text-primary font-mono text-xs w-fit">
          @org/ui TanStack Table
        </Badge>
      </div>

      {/* Control Playground Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Tuning & Mode Tabel Interaktif</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Ubah konfigurasi densitas ukuran baris, mode striped/bordered, seleksi checkbox, atau simulasi state loading secara instan.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Density Picker */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Density:</span>
              {(["compact", "default", "relaxed"] as TableDensity[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer transition-colors ${
                    density === d
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Variant Picker */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Variant:</span>
              {(["default", "striped", "bordered"] as TableVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer transition-colors ${
                    variant === v
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Selectable Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Checkbox Selection:</span>
              <button
                type="button"
                onClick={() => setSelectable(!selectable)}
                className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer transition-colors ${
                  selectable
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {selectable ? "Aktif" : "Nonaktif"}
              </button>
            </div>

            {/* Loading Simulator */}
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs cursor-pointer"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1200);
                }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
                <span>Simulasi Loading (1.2s)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise DataTable Showcase */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Live Preview Komponen <code>&lt;DataTable /&gt;</code> (@tanstack/react-table)
          </span>
          <span>
            {selectedRows.length} dari {SAMPLE_MODULES.length} baris dipilih
          </span>
        </div>

        <DataTable<ServiceModule>
          data={SAMPLE_MODULES}
          columns={columns}
          getRowId={(r) => r.id}
          density={density}
          variant={variant}
          enableRowSelection={selectable}
          onRowSelectionChange={handleRowSelectionChange}
          loading={isLoading}
          showSearch={true}
          searchPlaceholder="Cari modul, kategori, atau ID..."
          pageSize={5}
          pageSizeOptions={[5, 10, 20]}
          toolbar={
            <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Modul</span>
            </Button>
          }
          bulkActions={(selected) => (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => alert(`Mengunduh laporan untuk ${selected.length} modul...`)}
              >
                <Download className="h-3 w-3" />
                <span>Export ({selected.length})</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  if (confirm(`Hapus ${selected.length} modul terpilih?`)) {
                    setSelectedRows([]);
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
                <span>Hapus ({selected.length})</span>
              </Button>
            </div>
          )}
          emptyState={{
            icon: <Sparkles className="h-6 w-6 text-primary" />,
            title: "Modul Tidak Ditemukan",
            description: "Tidak ada layanan yang sesuai dengan kriteria pencarian Anda.",
          }}
        />
      </div>
    </div>
  );
}

export default DataPage;
