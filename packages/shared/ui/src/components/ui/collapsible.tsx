import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"

import { cn } from "../../utils/cn"

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root {...props} />
}
Collapsible.displayName = "Collapsible"

function CollapsibleTrigger({ className, children, asChild, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> & { className?: string }) {
  if (asChild) {
    return (
      <CollapsiblePrimitive.CollapsibleTrigger asChild className={className} {...props}>
        {children}
      </CollapsiblePrimitive.CollapsibleTrigger>
    )
  }

  return (
    <CollapsiblePrimitive.CollapsibleTrigger className={cn("flex items-center gap-2", className)} {...props}>
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" aria-hidden />
    </CollapsiblePrimitive.CollapsibleTrigger>
  )
}
CollapsibleTrigger.displayName = "CollapsibleTrigger"

function CollapsibleContent({ className, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> & { className?: string }) {
  return <CollapsiblePrimitive.CollapsibleContent className={cn(className)} {...props} />
}
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
