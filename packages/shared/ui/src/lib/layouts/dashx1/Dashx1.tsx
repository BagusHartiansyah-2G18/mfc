

import { Sidebar } from './Sidex1';
interface children {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
}
function Header() {
  return (
    <header
      style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <h3>BGS Platform</h3>
    </header>
  );
}
 

function PageContainer({
  children,
}: children) {
  return (
    <div
      style={{
        padding: '20px',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

export function DashboardLayout({
  children,
  sidebar,
}: children) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />

      <div
        style={{
          flex: 1,
          display: 'flex',
        }}
      >
        <Sidebar>{sidebar ?? 'Sidebar'}</Sidebar>

        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  );
}