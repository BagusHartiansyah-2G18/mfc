interface SidebarProps {
  children?: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside
      style={{
        width: '240px',
        background: '#1e293b',
        color: 'white',
        padding: '16px',
      }}
    >
      {children}
    </aside>
  );
}