import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@org/ui';
import {
  Terminal,
  Search,
  Filter,
  Download,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Info,
  ExternalLink,
  Code2,
  Layers,
  Sparkles,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { userMgmtStore } from '../store/user-mgmt-store';
import {
  type ApiLogEntry,
  type ApiLogStatus,
  type User,
  API_LOG_STANDARDS,
} from '../types/user-mgmt';

export function ApiLogTab() {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  // Form state untuk tester simulasi request
  const [simSelectedUserId, setSimSelectedUserId] = useState<string>('usr-1');
  const [simApiKey, setSimApiKey] = useState('bgs-live-key-2026');
  const [simCertNumber, setSimCertNumber] = useState('CERT-BGS-2026-001');
  const [simParamName, setSimParamName] = useState('certificate_number');
  const [lastSimResult, setLastSimResult] = useState<ApiLogEntry | null>(null);

  // Map API Keys per user ID
  const USER_API_KEYS: Record<string, string> = {
    'usr-1': 'bgs-live-key-2026',
    'usr-2': 'bgs-pm-key-2026',
    'usr-3': 'bgs-dev-key-2026',
    'usr-4': 'bgs-client-key-2026',
  };

  useEffect(() => {
    setLogs(userMgmtStore.getApiLogs());
    setUsers(userMgmtStore.getUsers());
    const unsubscribe = userMgmtStore.subscribe(() => {
      setLogs(userMgmtStore.getApiLogs());
      setUsers(userMgmtStore.getUsers());
    });
    return () => unsubscribe();
  }, []);

  // Filter logs berdasarkan query pencarian, status code, dan user
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter status code
      if (statusCodeFilter !== 'ALL' && log.statusCode.toString() !== statusCodeFilter) {
        return false;
      }

      // Filter User
      if (userFilter !== 'ALL') {
        if (userFilter === 'guest' && log.username !== 'guest') return false;
        if (userFilter !== 'guest' && log.username !== userFilter && log.userId !== userFilter) {
          return false;
        }
      }

      // Filter teks pencarian (mencakup ID, Certificate Number, Endpoint, Username, atau Message)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.id.toLowerCase().includes(q) ||
        (log.certificateNumber && log.certificateNumber.toLowerCase().includes(q)) ||
        (log.username && log.username.toLowerCase().includes(q)) ||
        (log.userFullName && log.userFullName.toLowerCase().includes(q)) ||
        log.endpoint.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, statusCodeFilter, userFilter]);

  // Statistik KPI ringkas
  const stats = useMemo(() => {
    const total = logs.length;
    const count200 = logs.filter((l) => l.statusCode === 200).length;
    const count400 = logs.filter((l) => l.statusCode === 400).length;
    const count401 = logs.filter((l) => l.statusCode === 401).length;
    const count404 = logs.filter((l) => l.statusCode === 404).length;
    return { total, count200, count400, count401, count404 };
  }, [logs]);

  // Helper render badge status HTTP
  const renderStatusBadge = (status: ApiLogStatus, code: number) => {
    if (code === 200) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          {status}
        </Badge>
      );
    }
    if (code === 401) {
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold gap-1"
        >
          <ShieldAlert className="h-3 w-3" />
          {status}
        </Badge>
      );
    }
    if (code === 404) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          {status}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-semibold gap-1"
      >
        <XCircle className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Helper status code pill
  const renderStatusCode = (code: number) => {
    let colorClass = 'text-emerald-700 bg-emerald-100/70 border-emerald-300';
    if (code === 401) colorClass = 'text-rose-700 bg-rose-100/70 border-rose-300';
    else if (code === 404) colorClass = 'text-amber-700 bg-amber-100/70 border-amber-300';
    else if (code >= 400) colorClass = 'text-orange-700 bg-orange-100/70 border-orange-300';

    return (
      <span
        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${colorClass}`}
      >
        {code}
      </span>
    );
  };

  // Eksekusi preset simulasi cepat
  const runPresetSimulation = (conditionKey: string) => {
    let apiKey: string | undefined = 'bgs-live-key-2026';
    let certNum: string | undefined = 'CERT-BGS-2026-001';
    let userId: string | undefined = 'usr-1';

    switch (conditionKey) {
      case 'MISSING_API_KEY':
        apiKey = '';
        certNum = 'CERT-BGS-2026-001';
        userId = undefined;
        break;
      case 'INVALID_API_KEY':
        apiKey = 'wrong-invalid-key-xyz';
        certNum = 'CERT-BGS-2026-001';
        userId = undefined;
        break;
      case 'MISSING_PARAMETER':
        apiKey = 'bgs-live-key-2026';
        certNum = undefined;
        userId = 'usr-1';
        break;
      case 'WHITESPACE_PARAMETER':
        apiKey = 'bgs-live-key-2026';
        certNum = '    ';
        userId = 'usr-1';
        break;
      case 'NOT_FOUND_PARAMETER':
        apiKey = 'bgs-live-key-2026';
        certNum = 'CERT-TIDAK-DITEMUKAN-999';
        userId = 'usr-1';
        break;
      case 'FOUND_PARAMETER':
      default:
        apiKey = 'bgs-live-key-2026';
        certNum = 'CERT-BGS-2026-001';
        userId = 'usr-1';
        break;
    }

    setSimApiKey(apiKey ?? '');
    setSimCertNumber(certNum ?? '');
    setSimSelectedUserId(userId ?? 'guest');

    const res = userMgmtStore.simulateApiCall({
      userId,
      apiKey,
      certificateNumber: certNum,
      parameterName: simParamName,
    });
    setLastSimResult(res);
  };

  // Eksekusi request custom dari modal form
  const handleExecuteCustomSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const res = userMgmtStore.simulateApiCall({
      userId: simSelectedUserId === 'guest' ? undefined : simSelectedUserId,
      apiKey: simApiKey,
      certificateNumber: simCertNumber,
      parameterName: simParamName,
    });
    setLastSimResult(res);
  };

  // Handler saat user memilih akun pemanggil di modal simulasi
  const handleSelectSimUser = (userId: string) => {
    setSimSelectedUserId(userId);
    if (userId === 'guest') {
      setSimApiKey('');
    } else {
      setSimApiKey(USER_API_KEYS[userId] || 'bgs-live-key-2026');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'REQUEST_DATE',
      'USER_ID',
      'USERNAME',
      'USER_FULLNAME',
      'BASE_URL',
      'ENDPOINT',
      'CERTIFICATE_NUMBER',
      'STATUS',
      'STATUS_CODE',
      'MESSAGE',
    ];
    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.requestDate}"`,
      `"${log.userId || '-'}"`,
      `"${log.username}"`,
      `"${(log.userFullName || '').replace(/"/g, '""')}"`,
      `"${log.baseUrl}"`,
      `"${log.endpoint}"`,
      `"${log.certificateNumber}"`,
      `"${log.status}"`,
      log.statusCode,
      `"${log.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bgs_api_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER & KPI CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Log API & Verifikasi Pengguna
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                  {filteredLogs.length} Records
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Setiap log terhubung langsung dengan akun pengguna (User / Client), audit status
                HTTP, dan pesan validasi standar keamanan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setLastSimResult(null);
              setIsSimulateOpen(true);
            }}
            className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Simulasi Request API
          </Button>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-3 shadow-xs">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Request
          </div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</div>
        </div>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> 200 OK (Found)
          </div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">
            {stats.count200}
          </div>
        </div>

        <div className="rounded-xl border border-orange-200/60 bg-orange-50/40 dark:bg-orange-950/20 p-3 shadow-xs">
          <div className="text-[11px] font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="h-3 w-3" /> 400 Bad Request
          </div>
          <div className="text-2xl font-bold text-orange-800 dark:text-orange-200 mt-0.5">
            {stats.count400}
          </div>
        </div>

        <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 dark:bg-rose-950/20 p-3 shadow-xs">
          <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> 401 Unauthorized
          </div>
          <div className="text-2xl font-bold text-rose-800 dark:text-rose-200 mt-0.5">
            {stats.count401}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20 p-3 shadow-xs">
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> 404 Not Found
          </div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-0.5">
            {stats.count404}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STANDAR INFORMASI PESAN (KARTU ACUAN RESMI)                             */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-r from-card to-muted/30 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Standar Informasi Pesan API (SOP Respon Validasi)
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Klik salah satu untuk menjalankan uji simulasi instan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Object.values(API_LOG_STANDARDS).map((std) => (
            <button
              key={std.key}
              type="button"
              onClick={() => runPresetSimulation(std.key)}
              className="text-left p-2.5 rounded-lg border border-border/50 bg-background/80 hover:bg-muted/70 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-semibold text-muted-foreground capitalize">
                  {std.condition}
                </span>
                {renderStatusCode(std.statusCode)}
              </div>
              <div className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                "{std.defaultMessage}"
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR PENCARIAN & FILTER                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari ID, User, Certificate, Endpoint, atau Pesan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* User Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Semua Pengguna</option>
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  @{u.username} ({u.name})
                </option>
              ))}
              <option value="guest">Guest / Unauthenticated</option>
            </select>
          </div>

          {/* Status Code Filter */}
          <div className="flex rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
            {['ALL', '200', '400', '401', '404'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setStatusCodeFilter(code)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all text-xs ${
                  statusCodeFilter === code
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {code === 'ALL' ? 'Semua' : code}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => userMgmtStore.resetToDefault()}
            className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            title="Reset log ke default"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Log
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABEL LOG API TERHUBUNG DENGAN USER                                     */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-36">
                  ID
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-40">
                  REQUEST_DATE
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-48">
                  PENGGUNA (USER)
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-40">
                  BASE_URL
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-36">
                  ENDPOINT
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-40">
                  CERTIFICATE_NUMBER
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-28 text-center">
                  STATUS
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground w-24 text-center">
                  STATUS_CODE
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground min-w-[240px]">
                  MESSAGE
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Terminal className="h-6 w-6 text-muted-foreground/50" />
                      <span className="font-medium text-xs">Tidak ada log API yang cocok.</span>
                      <span className="text-[11px] text-muted-foreground/80">
                        Coba sesuaikan filter pengguna atau jalankan simulasi baru.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors group"
                  >
                    {/* ID */}
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {log.id}
                    </TableCell>

                    {/* REQUEST_DATE */}
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {log.requestDate}
                    </TableCell>

                    {/* USER (Relasi Pengguna) */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-1 ${
                            log.userId
                              ? 'bg-primary/10 text-primary ring-primary/20'
                              : 'bg-muted text-muted-foreground ring-border'
                          }`}
                        >
                          {log.username ? log.username.substring(0, 2).toUpperCase() : 'GS'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate flex items-center gap-1">
                            @{log.username}
                          </div>
                          <div
                            className="text-[10px] text-muted-foreground truncate max-w-[130px]"
                            title={log.userFullName || log.roleName}
                          >
                            {log.userFullName || log.roleName || 'Client'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* BASE_URL */}
                    <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[160px]" title={log.baseUrl}>
                      {log.baseUrl}
                    </TableCell>

                    {/* ENDPOINT */}
                    <TableCell className="text-xs font-mono font-medium text-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border text-[11px]">
                        {log.endpoint}
                      </span>
                    </TableCell>

                    {/* CERTIFICATE_NUMBER */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {log.certificateNumber && log.certificateNumber.trim() !== '-' ? (
                        <span className="text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                          {log.certificateNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">-</span>
                      )}
                    </TableCell>

                    {/* STATUS */}
                    <TableCell className="text-center">
                      {renderStatusBadge(log.status, log.statusCode)}
                    </TableCell>

                    {/* STATUS_CODE */}
                    <TableCell className="text-center">
                      {renderStatusCode(log.statusCode)}
                    </TableCell>

                    {/* MESSAGE */}
                    <TableCell>
                      <div className="font-mono text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                        {log.message}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL SIMULASI / TESTER REQUEST API DENGAN PILIHAN USER                 */}
      {/* ========================================================================= */}
      <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-primary fill-primary/20" />
              Simulasi Uji Request API
            </DialogTitle>
            <DialogDescription className="text-xs">
              Uji coba request secara langsung dengan verifikasi identitas pengguna dan 6 skenario
              pesan standar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteCustomSimulation} className="space-y-4 py-2">
            {/* Quick Skenario Buttons */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Pilih Skenario Respon Instan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runPresetSimulation('FOUND_PARAMETER')}
                  className="text-xs justify-start h-8"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                  Parameter Benar (200)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runPresetSimulation('NOT_FOUND_PARAMETER')}
                  className="text-xs justify-start h-8"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mr-1.5" />
                  Parameter Salah (404)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runPresetSimulation('WHITESPACE_PARAMETER')}
                  className="text-xs justify-start h-8"
                >
                  <XCircle className="h-3.5 w-3.5 text-orange-600 mr-1.5" />
                  Parameter Space (400)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runPresetSimulation('MISSING_PARAMETER')}
                  className="text-xs justify-start h-8"
                >
                  <XCircle className="h-3.5 w-3.5 text-orange-600 mr-1.5" />
                  Parameter Tidak Ada (400)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runPresetSimulation('MISSING_API_KEY')}
                  className="text-xs justify-start h-8"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 mr-1.5" />
                  API Key Kosong (401)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runPresetSimulation('INVALID_API_KEY')}
                  className="text-xs justify-start h-8"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 mr-1.5" />
                  API Key Salah (401)
                </Button>
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              {/* Pilihan User Pemanggil API */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Akun Pemanggil (User Terhubung)
                </label>
                <select
                  value={simSelectedUserId}
                  onChange={(e) => handleSelectSimUser(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      @{u.username} — {u.name} (Key: {USER_API_KEYS[u.id] || 'bgs-live-key-2026'})
                    </option>
                  ))}
                  <option value="guest">Tamu / Tanpa Akun (Guest Client)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  API Key (Header: x-api-key)
                </label>
                <Input
                  type="text"
                  value={simApiKey}
                  onChange={(e) => setSimApiKey(e.target.value)}
                  placeholder="bgs-live-key-2026 (kosongkan untuk uji 401)"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Nama Parameter
                  </label>
                  <Input
                    type="text"
                    value={simParamName}
                    onChange={(e) => setSimParamName(e.target.value)}
                    placeholder="certificate_number"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Nilai (CERTIFICATE_NUMBER)
                  </label>
                  <Input
                    type="text"
                    value={simCertNumber}
                    onChange={(e) => setSimCertNumber(e.target.value)}
                    placeholder="CERT-BGS-2026-001"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Hasil Respon */}
            {lastSimResult && (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-primary" />
                    Hasil Respon API
                  </span>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(lastSimResult.status, lastSimResult.statusCode)}
                    {renderStatusCode(lastSimResult.statusCode)}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-background border border-border/60 font-mono text-xs">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold">MESSAGE:</div>
                  <div className="text-foreground font-semibold mt-0.5">"{lastSimResult.message}"</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-mono">
                  <div>Akun: @{lastSimResult.username} ({lastSimResult.userFullName || 'Guest'})</div>
                  <div>ID: {lastSimResult.id}</div>
                  <div>Latency: {lastSimResult.responseDurationMs}ms</div>
                  <div>Method: {lastSimResult.method}</div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSimulateOpen(false)}
                className="text-xs"
              >
                Tutup
              </Button>
              <Button
                type="submit"
                className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Kirim Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 6. MODAL RINCIAN LOG                                                      */}
      {/* ========================================================================= */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Info className="h-4.5 w-4.5 text-primary" />
                Rincian Log Request: {selectedLog.id}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono">
                Waktu eksekusi: {selectedLog.requestDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              {/* Data Akun Pengguna Terhubung */}
              <div className="p-3 rounded-lg border bg-primary/5 border-primary/20 space-y-2">
                <div className="text-[10px] text-primary uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <UserIcon className="h-3 w-3" />
                  Informasi Pengguna (Caller Account)
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      {selectedLog.userFullName || 'Tamu / Unauthenticated'}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      @{selectedLog.username} {selectedLog.userId ? `(ID: ${selectedLog.userId})` : ''}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-medium">
                    {selectedLog.roleName || (selectedLog.statusCode === 401 ? 'Guest' : 'Member')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Status Respon</div>
                  <div className="mt-1 flex items-center gap-2">
                    {renderStatusBadge(selectedLog.status, selectedLog.statusCode)}
                    {renderStatusCode(selectedLog.statusCode)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Durasi Respon</div>
                  <div className="mt-1 font-mono font-semibold text-foreground">
                    {selectedLog.responseDurationMs ?? 25} ms
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Standard Message</div>
                <div className="p-2.5 rounded-lg border bg-background font-mono text-xs font-semibold text-foreground">
                  "{selectedLog.message}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px] block uppercase font-bold">BASE_URL</span>
                  <span className="text-foreground">{selectedLog.baseUrl}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block uppercase font-bold">ENDPOINT</span>
                  <span className="text-foreground font-semibold">{selectedLog.endpoint}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block uppercase font-bold">CERTIFICATE_NUMBER</span>
                  <span className="text-foreground font-bold">{selectedLog.certificateNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block uppercase font-bold">IP_ADDRESS</span>
                  <span className="text-foreground">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
export default ApiLogTab;
