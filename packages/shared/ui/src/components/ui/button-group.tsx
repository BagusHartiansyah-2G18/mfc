import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "../../utils/cn"
import { buttonVariants, type VariantProps } from "./button"

export interface ButtonGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  orientation?: "horizontal" | "vertical"
  attached?: boolean
  children?: React.ReactNode
}

export function ButtonGroup({
  orientation = "horizontal",
  attached = true,
  className,
  children,
  ...props
}: ButtonGroupProps) {
  const isVertical = orientation === "vertical"
  const groupClass = cn(
    "inline-flex shadow-sm",
    isVertical ? "flex-col" : "flex-row",
    attached ? (isVertical ? "divide-y" : "divide-x") : "",
    className,
  )
  return (
    <div role="group" className={groupClass} {...props}>
      {children}
    </div>
  )
}

export interface ButtonGroupItemProps extends VariantProps<typeof buttonVariants> {
  className?: string
  asChild?: boolean
  children?: React.ReactNode
}

export function ButtonGroupItem({ variant, size, className, asChild, children }: ButtonGroupItemProps) {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))}>{children}</Comp>
}
