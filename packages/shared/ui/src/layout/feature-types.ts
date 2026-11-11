export interface FeatureMenuItem {
  id: string
  label: string
  path: string
  icon?: string
  order?: number
  enabled?: boolean
  badge?: string
  role?: string
}

export interface FeatureMenuSection {
  section: string
  items: FeatureMenuItem[]
}

export interface FeatureMenu {
  brand: string
  shell?: {
    sidebar?: {
      collapsible?: boolean
      defaultOpen?: boolean
    }
  }
  menus: FeatureMenuSection[]
}

export function filterEnabled(items: FeatureMenuItem[]): FeatureMenuItem[] {
  return items.filter((i) => i.enabled !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export function flattenMenu(menu: FeatureMenu) {
  return menu.menus.flatMap((s) => filterEnabled(s.items).map((item) => ({ ...item, section: s.section })))
}
