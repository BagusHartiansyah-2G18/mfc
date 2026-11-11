import * as React from "react"

import { cn } from "../../utils/cn"
import { Badge } from "./badge"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Progress } from "./progress"
import { Skeleton } from "./skeleton"
import { Avatar, AvatarFallback } from "./avatar"
import { Separator } from "./separator"
import { Empty } from "./empty"
import { WidgetTable } from "./widget-table"
import type { WidgetProps } from "./widget-types"

export function Widget<T extends Record<string, unknown> = Record<string, unknown>>(
  props: WidgetProps<T> & { className?: string }
) {
  const { title, description, action, className } = props

  let content: React.ReactNode = null

  switch (props.variant) {
    case "actions": {
      const { buttons, badges } = props
      content = (
        <div className="flex flex-wrap gap-2">
          {buttons.map((b) => (
            <Button key={b.label} variant={b.variant} onClick={b.onClick} disabled={b.disabled}>
              {b.label}
            </Button>
          ))}
          {badges?.map((b) => (
            <Badge key={b} variant="secondary">{b}</Badge>
          ))}
        </div>
      )
      break
    }
    case "alert": {
      const { alerts } = props
      content = (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <Alert key={`${a.title}-${i}`} variant={a.variant}>
              <AlertTitle>{a.title}</AlertTitle>
              {a.description && <AlertDescription>{a.description}</AlertDescription>}
            </Alert>
          ))}
        </div>
      )
      break
    }
    case "progress": {
      const { value } = props
      content = (
        <div className="space-y-3">
          <Progress value={value} />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )
      break
    }
    case "profile": {
      const { user, initials, empty } = props
      content = (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <span className="text-sm">{user}</span>
          </div>
          <Separator />
          <Empty title={empty?.title ?? "Belum ada data"} description={empty?.description ?? "Tambahkan item untuk mulai."} />
        </div>
      )
      break
    }
    case "table": {
      const { columns, config, skeletonRows } = props
      content = <WidgetTable columns={columns} config={config} skeletonRows={skeletonRows} />
      break
    }
    case "custom": {
      content = <>{props.children}</>
      break
    }
    default:
      content = null
  }

  return (
    <Card className={cn(className)}>
      {(title || description || action) && (
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {action}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(!title && !description && !action && "pt-6")}>
        {content}
        {props.children && props.variant !== "custom" && (
          <div className={cn(content ? "mt-4" : "")}>{props.children}</div>
        )}
      </CardContent>
    </Card>
  )
}
Widget.displayName = "Widget"

export type { WidgetProps }
