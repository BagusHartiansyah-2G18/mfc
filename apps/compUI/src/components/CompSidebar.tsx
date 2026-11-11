// CompSidebar is deprecated in favor of DashShell sidebar and in-view TabNav.
// Kept for backward compatibility if any legacy consumer references it.
export interface CompSidebarProps {
  basePath?: string;
}

export function CompSidebar(_props: CompSidebarProps) {
  return null;
}

export default CompSidebar;