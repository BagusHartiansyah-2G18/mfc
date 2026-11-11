import * as dashx1 from "./dashx1"
import * as publicx1 from "./publicx1"

export * from "./dashx1"
export * from "./publicx1"
export * from "./feature-types"
export * from "./icon-map"
export * from "./SubNav"

export { dashx1, publicx1 }

// Backward compatibility aliases
export { DashShell as AppShell, DashboardLayout } from "./dashx1"
export { DashHeader as Header } from "./dashx1"
export { DashSidebar as Sidebar } from "./dashx1"
export { DashBreadcrumb as Breadcrumb } from "./dashx1"
export { DashFooter as Footer } from "./dashx1"
export { PublicLayout, PublicHeader, PublicFooter } from "./publicx1"
