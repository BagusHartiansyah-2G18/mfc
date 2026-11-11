import {
  Home,
  Puzzle,
  LayoutDashboard,
  AppWindow,
  Settings,
  Users,
  FileText,
  BarChart3,
  Boxes,
  CreditCard,
  Database,
  FileCode2,
  LayoutGrid,
  LifeBuoy,
  ListTodo,
  Shield,
  Table2,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  puzzle: Puzzle,
  dashboard: LayoutDashboard,
  app: AppWindow,
  settings: Settings,
  users: Users,
  file: FileText,
  chart: BarChart3,
  boxes: Boxes,
  billing: CreditCard,
  database: Database,
  code: FileCode2,
  grid: LayoutGrid,
  help: LifeBuoy,
  todo: ListTodo,
  shield: Shield,
  table: Table2,
  wallet: Wallet,
}

export function getIcon(name?: string): LucideIcon {
  if (!name) return LayoutDashboard
  return ICON_MAP[name.toLowerCase()] ?? LayoutDashboard
}
