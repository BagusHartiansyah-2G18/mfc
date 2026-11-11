import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ScrollArea,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Badge,
  // Centralized @org/ui components
  TabNav,
  StatusBadge,
  FormField,
  InputWithIcon,
  PasswordInput,
} from "@org/ui";
import {
  Layers,
  Sparkles,
  Users,
  Shield,
  Sliders,
  Settings,
  Bell,
  CheckCircle2,
  Lock,
} from "lucide-react";

export function WidgetsPage() {
  const [open, setOpen] = useState(false);
  const [activeTabNav, setActiveTabNav] = useState("users");
  const [activeUnderlineTab, setActiveUnderlineTab] = useState("overview");

  const tabNavItems = [
    { id: "users", label: "Pengguna", icon: <Users className="h-3.5 w-3.5" />, badge: 12 },
    { id: "roles", label: "Role & Akses", icon: <Shield className="h-3.5 w-3.5" />, badge: 4 },
    { id: "settings", label: "Konfigurasi", icon: <Settings className="h-3.5 w-3.5" /> },
  ];

  const underlineNavItems = [
    { id: "overview", label: "Ikhtisar", badge: "Live" },
    { id: "analytics", label: "Analitik" },
    { id: "audit", label: "Audit Logs", badge: 3 },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Widgets</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Koleksi widget komposit, navigasi tab, modal dialog, panel sheet, popover, dan indikator status.
            </p>
          </div>
          <Badge variant="outline" className="text-primary font-mono text-xs w-fit">
            @org/ui components
          </Badge>
        </div>

        {/* ========================================================================= */}
        {/* 1. TABNAV CENTRALIZED COMPONENT SHOWCASE                                  */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              1. TabNav — Sistem Navigasi Tab Terpusat (@org/ui)
            </CardTitle>
            <CardDescription className="text-xs">
              Mendukung varian <code>segmented</code> dan <code>underline</code> dengan ikon dan counter badge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Varian Segmented (Pills Pill)
              </span>
              <TabNav
                items={tabNavItems}
                activeId={activeTabNav}
                onChange={setActiveTabNav}
                variant="segmented"
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Varian Underline (Border Bawah Aktif)
              </span>
              <TabNav
                items={underlineNavItems}
                activeId={activeUnderlineTab}
                onChange={setActiveUnderlineTab}
                variant="underline"
              />
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 2. STATUS BADGE CENTRALIZED COMPONENT                                     */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              2. StatusBadge — Indikator Status & Pulse Animation (@org/ui)
            </CardTitle>
            <CardDescription className="text-xs">
              Mewakili status data secara seragam dengan dot indikator dan pulsing glow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Active:</span>
                <StatusBadge status="active" label="Aktif" pulse />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Inactive:</span>
                <StatusBadge status="inactive" label="Nonaktif" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Suspended:</span>
                <StatusBadge status="suspended" label="Ditangguhkan" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Pending:</span>
                <StatusBadge status="pending" label="Menunggu" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Custom Status:</span>
                <StatusBadge status="review" label="Dalam Review" pulse={false} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 3. RADIX TABS PRIMITIVE (Dibutuhkan untuk Unit Test & Standar)             */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">3. Standard Tabs Component</CardTitle>
            <CardDescription className="text-xs">
              Tabs primitive berbasis Radix UI untuk konten halaman bersarang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="account">
              <TabsList>
                <TabsTrigger value="account">Akun</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Informasi Akun</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Nama Pengguna" htmlFor="name">
                      <Input id="name" defaultValue="Administrator Utama" />
                    </FormField>
                    <FormField label="Alamat Email" htmlFor="email">
                      <Input id="email" type="email" defaultValue="admin@bgs.id" />
                    </FormField>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="password">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Kredensial Kata Sandi</h4>
                  <p className="text-xs text-muted-foreground">
                    Password akun dilindungi secara kriptografis menggunakan algoritma Bcrypt.
                  </p>
                  <PasswordInput displayMaskedOnly />
                </div>
              </TabsContent>

              <TabsContent value="billing">
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Pengaturan Langganan & Billing</h4>
                  <p className="text-xs text-muted-foreground">
                    Paket Enterprise Cloud Aktif • Siklus Billing: Tahunan.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 4. OVERLAYS, DIALOGS, SHEETS, & MENUS                                     */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">4. Modals, Sheets, & Overlay Components</CardTitle>
            <CardDescription className="text-xs">
              Dialog modal, drawer sheet samping, dropdown menu, popover, dan tooltip.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2.5">
              {/* Modal Dialog */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Buka Modal Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profil Pengguna</DialogTitle>
                    <DialogDescription className="text-xs">
                      Perubahan konfigurasi akan segera disinkronkan ke database MySQL.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2 text-xs">
                    <FormField label="Nama Lengkap" htmlFor="dlg-name">
                      <Input id="dlg-name" defaultValue="Budi Pratama" />
                    </FormField>
                    <FormField label="Kata Sandi Baru" htmlFor="dlg-pass">
                      <PasswordInput id="dlg-pass" placeholder="Password baru..." showStrengthMeter />
                    </FormField>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                      Batal
                    </Button>
                    <Button size="sm" onClick={() => setOpen(false)}>
                      Simpan Perubahan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Side Drawer Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">Buka Panel Sheet</Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Drawer Samping (Sheet)</SheetTitle>
                    <SheetDescription className="text-xs">
                      Sangat ideal untuk navigasi mobile, filter tingkat lanjut, atau formulir cepat.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-3 text-xs">
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="font-medium text-foreground">Status MFE:</p>
                      <StatusBadge status="active" label="Terkoneksi" className="mt-1" />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Dropdown Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Menu Pengguna</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profil Saya</DropdownMenuItem>
                  <DropdownMenuItem>Kelola Role</DropdownMenuItem>
                  <DropdownMenuItem>Pengaturan Keamanan</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Keluar (Logout)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">Trigger Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-xs space-y-1.5">
                  <p className="font-semibold text-foreground">Informasi Popover</p>
                  <p className="text-muted-foreground">
                    Konten popover ringkas yang mengambang dekat elemen pemanggilnya.
                  </p>
                </PopoverContent>
              </Popover>

              {/* Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">Arahkan Kursor (Tooltip)</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Tooltip terstandarisasi @org/ui</span>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Collapsible Container */}
            <Collapsible className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Collapsible FAQ & Container Informasi
                </span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Buka / Tutup
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="pt-2 text-xs text-muted-foreground border-t mt-2">
                Konten collapsible yang dapat disembunyikan. Komponen ini cocok digunakan untuk accordion FAQ, panel detail teknis, atau riwayat audit tersembunyi.
              </CollapsibleContent>
            </Collapsible>

            {/* Scroll Area */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">ScrollArea dengan Scrollbar Kustom</Label>
              <ScrollArea className="h-28 rounded-md border p-3 text-xs">
                <div className="space-y-2">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-border/40 text-muted-foreground">
                      <span>Log aktivitas komponen #{i + 1}</span>
                      <StatusBadge status={i % 2 === 0 ? "active" : "pending"} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export default WidgetsPage;
