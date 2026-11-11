// Exposed by the federation plugin as 'compUI/App'.
// Consumers render it lazily via `lazyProvider('compUI', 'App')`.
import { useMemo } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  DashShell,
  DashFooter,
  type FeatureMenu,
  TabNav,
  type TabNavItem,
} from '@org/ui';
import { LayoutDashboard, Shapes, FormInput, Table2 } from 'lucide-react';
import { OverviewPage } from './pages/OverviewPage';
import { WidgetsPage } from './pages/WidgetsPage';
import { FormsPage } from './pages/FormsPage';
import { DataPage } from './pages/DataPage';
import './styles.css';

export interface CompUIAppProps {
  basePath?: string;
}

export function App({ basePath = '/compUI' }: CompUIAppProps) {
  const prefix = basePath ? basePath.replace(/\/$/, '') : '';
  const location = useLocation();
  const navigate = useNavigate();

  // Menu untuk mode Standalone Host (port 4201)
  const standaloneMenu: FeatureMenu = useMemo(
    () => ({
      brand: 'MFC Component UI',
      menus: [
        {
          section: 'Component Library',
          items: [
            { id: 'overview', label: 'Overview', path: prefix || '/', icon: 'dashboard' },
            { id: 'widgets', label: 'Widgets', path: `${prefix}/widgets`, icon: 'widgets' },
            { id: 'forms', label: 'Forms & Inputs', path: `${prefix}/forms`, icon: 'forms' },
            { id: 'data', label: 'Data & Tables', path: `${prefix}/data`, icon: 'table' },
          ],
        },
      ],
    }),
    [prefix]
  );

  // Tab navigation items untuk navigasi horizontal antar halaman showcase
  const navTabs: TabNavItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { id: 'widgets', label: 'Widgets & Overlays', icon: <Shapes className="h-3.5 w-3.5" /> },
    { id: 'forms', label: 'Forms & Specialized Inputs', icon: <FormInput className="h-3.5 w-3.5" /> },
    { id: 'data', label: 'Data & Tables', icon: <Table2 className="h-3.5 w-3.5" /> },
  ];

  // Menentukan tab aktif berdasarkan URL saat ini
  const activeTabId = useMemo(() => {
    const p = location.pathname;
    if (p.endsWith('/widgets')) return 'widgets';
    if (p.endsWith('/forms')) return 'forms';
    if (p.endsWith('/data')) return 'data';
    return 'overview';
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'overview') {
      navigate(prefix || '/');
    } else {
      navigate(`${prefix}/${tabId}`);
    }
  };

  const content = (
    <div data-testid="compUI" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Quick Navigation Bar menggunakan TabNav mutakhir */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-3">
        <TabNav
          items={navTabs}
          activeId={activeTabId}
          onChange={handleTabChange}
          variant="segmented"
        />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-[11px] text-muted-foreground font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{basePath ? 'Terintegrasi Portal Host' : 'Mode Standalone (Port 4201)'}</span>
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <Routes>
          <Route index element={<OverviewPage basePath={prefix} />} />
          <Route path="widgets" element={<WidgetsPage />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="data" element={<DataPage />} />
          <Route path="*" element={<OverviewPage basePath={prefix} />} />
        </Routes>
      </div>
    </div>
  );

  // Jika dipanggil dari Portal Host (basePath ada), Portal sudah membungkus dengan AppShell/DashShell
  if (basePath) {
    return content;
  }

  // Jika berjalan standalone, bungkus dengan DashShell dan Footer terstandar
  return (
    <DashShell menu={standaloneMenu} footer={<DashFooter brand="MFC Component UI (Standalone Host)" />}>
      {content}
    </DashShell>
  );
}

export default App;