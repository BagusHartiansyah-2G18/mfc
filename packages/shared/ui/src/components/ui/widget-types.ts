import type * as React from "react"

export interface AlertItem {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export interface Column<T> {
  key: keyof T & string
  label: string
  render?: (row: T) => React.ReactNode
}

export interface LocalTableConfig<T> {
  data: T[]
  pageSize?: number
  searchKeys?: Array<keyof T & string>
}

export interface RemoteTableConfig<T> {
  url: string
  pageSize?: number
  searchKeys?: Array<keyof T & string>
}

export type TableConfig<T> = LocalTableConfig<T> | RemoteTableConfig<T>

export interface BaseWidgetProps {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export type WidgetProps<T = Record<string, unknown>> =
  | (BaseWidgetProps & {
      variant: "actions"
      buttons: Array<{
        label: string
        variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
        onClick?: React.MouseEventHandler
        disabled?: boolean
      }>
      badges?: string[]
    })
  | (BaseWidgetProps & { variant: "alert"; alerts: AlertItem[] })
  | (BaseWidgetProps & { variant: "progress"; value: number })
  | (BaseWidgetProps & {
      variant: "profile"
      user: string
      initials: string
      empty?: { title: string; description: string }
    })
  | (BaseWidgetProps & {
      variant: "table"
      columns: Column<T>[]
      config: TableConfig<T>
      skeletonRows?: number
    })
  | (BaseWidgetProps & { variant: "custom"; children: React.ReactNode })
