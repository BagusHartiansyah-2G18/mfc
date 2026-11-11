import { useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Textarea,
  Checkbox,
  Switch,
  RadioGroup,
  RadioGroupItem,
  Pagination,
  Button,
  Combobox,
  Badge,
  Alert,
  AlertDescription,
  type ComboboxItem,
  // Centralized @org/ui components
  InputWithIcon,
  InputWithBtnPopUp,
  PasswordInput,
  FormField,
  SelectField,
  StatusBadge,
} from "@org/ui";
import {
  User,
  Search,
  Phone,
  Mail,
  Lock,
  Building2,
  Briefcase,
  Copy,
  Check,
  Filter,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";

const KATEGORI: ComboboxItem[] = [
  { value: "elek", label: "Elektronik & Gadget" },
  { value: "fash", label: "Fashion & Busana" },
  { value: "rumah", label: "Peralatan Rumah Tangga" },
  { value: "soft", label: "Software & SaaS Solutions" },
];

export function FormsPage() {
  const [page, setPage] = useState(1);
  const [kategori, setKategori] = useState("elek");
  const [judul, setJudul] = useState("");
  const [aktif, setAktif] = useState(true);

  // States untuk Komponen Baru (@org/ui)
  const [searchVal, setSearchVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("+62 812-3456-7890");
  const [emailVal, setEmailVal] = useState("engineer@bgs-software.id");
  const [loadingInput, setLoadingInput] = useState(false);
  const [errorInputVal, setErrorInputVal] = useState("Nilai tidak valid");

  // InputWithBtnPopUp States
  const [popupInputVal, setPopupInputVal] = useState("Token-API-Secret-XYZ-9988");
  const [copied, setCopied] = useState(false);
  const [selectedTag, setSelectedTag] = useState("PROD");

  // PasswordInput States
  const [demoPassword, setDemoPassword] = useState("BgsSecurePass2026!");

  // SelectField States
  const [selectedRole, setSelectedRole] = useState("role-dev");
  const [selectedGender, setSelectedGender] = useState("Laki-laki");

  // Form Simulator Submission State
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(popupInputVal);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSimulateSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmittedData({
      judul,
      kategori,
      phoneVal,
      emailVal,
      selectedRole,
      selectedGender,
      demoPassword: "•••••••••••• (Encrypted Bcrypt)",
      aktif,
      submittedAt: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Forms & Specialized Inputs</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Katalog form input mutakhir dari <code>@org/ui</code>: Ikon, Popup Aksi, Password Terenkripsi, dan Validasi.
          </p>
        </div>
        <Badge variant="outline" className="text-primary font-mono text-xs w-fit">
          @org/ui components
        </Badge>
      </div>

      {/* ========================================================================= */}
      {/* SEKSI 1: INPUT WITH ICON (@org/ui)                                        */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            1. InputWithIcon — Input dengan Slot Ikon & Fitur Clearable
          </CardTitle>
          <CardDescription className="text-xs">
            Mendukung posisi ikon (kiri/kanan), tombol hapus cepat (clearable), indikator loading, dan penanganan error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search Input dengan Clearable */}
            <FormField label="Pencarian Cepat (Clearable)" htmlFor="demo-search">
              <InputWithIcon
                id="demo-search"
                icon={<Search className="h-4 w-4" />}
                placeholder="Ketik kata kunci pencarian..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                clearable
              />
            </FormField>

            {/* Input Nomor HP / WhatsApp */}
            <FormField label="Nomor Telepon / WhatsApp" htmlFor="demo-phone">
              <InputWithIcon
                id="demo-phone"
                icon={<Phone className="h-4 w-4" />}
                placeholder="+62 812-xxxx-xxxx"
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
              />
            </FormField>

            {/* Input Email */}
            <FormField label="Alamat Email Akun" htmlFor="demo-email">
              <InputWithIcon
                id="demo-email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="user@domain.id"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-2">
            {/* Loading Input State */}
            <FormField
              label="Input dengan Status Loading"
              helperText="Ikon loader otomatis berputar saat asynchronous request."
            >
              <InputWithIcon
                icon={<User className="h-4 w-4" />}
                placeholder="Memeriksa ketersediaan..."
                loading={loadingInput}
                defaultValue="superadmin"
              />
            </FormField>

            {/* Input dengan Error State */}
            <FormField
              label="Input dengan Validasi Error"
              error={errorInputVal.length < 5 ? "Teks harus minimal 5 karakter" : undefined}
            >
              <InputWithIcon
                icon={<MapPin className="h-4 w-4" />}
                value={errorInputVal}
                onChange={(e) => setErrorInputVal(e.target.value)}
                error={errorInputVal.length < 5 ? "Error" : undefined}
                placeholder="Alamat domisili..."
              />
            </FormField>

            {/* Input Ukuran Small & Large */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Ukuran Size (sm & lg)</Label>
              <div className="flex gap-2">
                <InputWithIcon
                  icon={<Calendar className="h-3 w-3" />}
                  size="sm"
                  placeholder="Size sm (h-8)"
                />
                <InputWithIcon
                  icon={<Briefcase className="h-4 w-4" />}
                  size="lg"
                  placeholder="Size lg (h-10)"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEKSI 2: INPUT WITH BTN POPUP (@org/ui)                                   */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            2. InputWithBtnPopUp — Input Terintegrasi Tombol Aksi & Popover
          </CardTitle>
          <CardDescription className="text-xs">
            Menggabungkan input dengan tombol aksi langsung atau popover pemilih tanpa perlu wrapper custom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Input dengan Tombol Aksi (Copy to Clipboard) */}
            <FormField
              label="Input dengan Tombol Aksi Salin (Action Button)"
              helperText="Klik tombol 'Salin' untuk menduplikasi isi input ke clipboard."
            >
              <InputWithBtnPopUp
                value={popupInputVal}
                onChange={(e) => setPopupInputVal(e.target.value)}
                buttonIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                buttonLabel={copied ? "Tersalin!" : "Salin Kredensial"}
                buttonVariant="secondary"
                onButtonClick={handleCopy}
              />
            </FormField>

            {/* Input dengan Trigger PopUp / Popover */}
            <FormField
              label="Input dengan Trigger PopUp (Interactive Popover Content)"
              helperText="Klik tombol 'Filter' untuk membuka panel parameter popup."
            >
              <InputWithBtnPopUp
                placeholder="Cari berdasarkan tag sistem..."
                value={`Filter Terpilih: [${selectedTag}]`}
                readOnly
                buttonIcon={<Filter className="h-3.5 w-3.5 text-primary" />}
                buttonLabel="Filter"
                popupTitle="Pilih Parameter Tag"
                popupContent={
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Pilih lingkungan target:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["DEV", "STAGING", "PROD"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag)}
                          className={`rounded px-2 py-1 text-center font-mono text-xs transition-colors cursor-pointer ${
                            selectedTag === tag
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-muted text-foreground hover:bg-accent"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                }
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEKSI 3: PASSWORD INPUT SECURE (@org/ui)                                 */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            3. PasswordInput — Kredensial Terenkripsi & Strength Meter
          </CardTitle>
          <CardDescription className="text-xs">
            Standarisasi kata sandi dengan toggle show/hide, indikator kekuatan password, dan mode mask statis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 items-start">
            {/* Interactive Password Input */}
            <FormField
              label="Kata Sandi Interaktif (Show Strength Meter)"
              helperText="Coba ketik variasi huruf besar, angka, dan simbol untuk menguji kalkulator kekuatan."
            >
              <PasswordInput
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                showStrengthMeter
                placeholder="Masukkan kata sandi baru..."
              />
            </FormField>

            {/* Static Masked Mode (untuk Tabel / Kartu Detail) */}
            <FormField
              label="Mode Masked Display Only (displayMaskedOnly)"
              helperText="Digunakan pada tabel atau kartu detail agar password tidak pernah bocor ke tampilan UI."
            >
              <div className="pt-1">
                <PasswordInput displayMaskedOnly />
              </div>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEKSI 4: FORMFIELD & SELECTFIELD TERSTANDARISASI (@org/ui)                 */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            4. FormField & SelectField — Dropdown Terstruktur & Validasi
          </CardTitle>
          <CardDescription className="text-xs">
            Pengorganisasian elemen formulir dengan label, opsi bertipe, dan format responsif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Role Pengguna Sistem"
              options={[
                { value: "role-superadmin", label: "Super Administrator" },
                { value: "role-pm", label: "Project Manager" },
                { value: "role-dev", label: "Software Engineer" },
                { value: "role-client", label: "Client Partner" },
              ]}
              value={selectedRole}
              onChange={setSelectedRole}
              helperText="Menentukan izin akses ke API dan modul."
            />

            <SelectField
              label="Jenis Kelamin (Demografi)"
              options={[
                { value: "Laki-laki", label: "Laki-laki" },
                { value: "Perempuan", label: "Perempuan" },
                { value: "Lainnya", label: "Lainnya" },
              ]}
              value={selectedGender}
              onChange={setSelectedGender}
            />

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Combobox Terintegrasi (Kategori)</Label>
              <Combobox
                options={KATEGORI}
                value={kategori}
                onValueChange={setKategori}
                placeholder="Pilih kategori produk..."
                searchPlaceholder="Cari kategori..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEKSI 5: FORMULIR SIMULASI LENGKAP                                         */}
      {/* ========================================================================= */}
      <Card className="border-primary/20 bg-primary/2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Formulir Simulasi — Integrasi Lengkap Seluruh Komponen @org/ui
          </CardTitle>
          <CardDescription className="text-xs">
            Uji interaksi end-to-end dari form lengkap dan periksa hasil pengiriman data secara live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSimulateSubmit} className="space-y-4 text-xs">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Judul Entri / Proyek" htmlFor="t" required>
                <InputWithIcon
                  id="t"
                  placeholder="Masukkan judul entri..."
                  value={judul}
                  onChange={(e) => {
                    setJudul(e.target.value);
                    setPage(1);
                  }}
                  clearable
                  icon={<User className="h-4 w-4" />}
                />
              </FormField>

              <FormField label="Deskripsi Singkat" htmlFor="desc">
                <Textarea id="desc" placeholder="Deskripsi ringkas proyek atau entri..." rows={2} />
              </FormField>
            </div>

            <div className="flex flex-wrap gap-6 items-center pt-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={aktif} onCheckedChange={(v) => setAktif(Boolean(v))} />
                <span>Publikasikan Segera (Checkbox)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch checked={aktif} onCheckedChange={(v) => setAktif(Boolean(v))} />
                <span>Status Aktif (Switch)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Indikator:</span>
                <StatusBadge status={aktif ? "active" : "inactive"} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Pagination
                currentPage={page}
                totalPages={5}
                onPageChange={setPage}
              />
              <Button type="submit" size="sm" className="gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Simulasikan Submit Data
              </Button>
            </div>
          </form>

          {/* Hasil Submit Live JSON */}
          {submittedData && (
            <div className="mt-4 rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Payload JSON Berhasil Digenerate:
                </span>
                <button
                  type="button"
                  onClick={() => setSubmittedData(null)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Tutup
                </button>
              </div>
              <pre className="rounded-md bg-muted p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FormsPage;
