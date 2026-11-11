import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils/cn"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-dashed",
        ghost: "border-transparent bg-transparent shadow-none",
        interactive: "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Card({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />
}
Card.displayName = "Card"

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}
CardHeader.displayName = "CardHeader"

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
}
CardTitle.displayName = "CardTitle"

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />
}
CardDescription.displayName = "CardDescription"

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}
CardContent.displayName = "CardContent"

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}
CardFooter.displayName = "CardFooter"

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start justify-items-end gap-1.5",
        className
      )}
      {...props}
    />
  )
}
CardAction.displayName = "CardAction"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardAction }
export { cardVariants as CardVariants }
export { Card as CardWithVariants }
