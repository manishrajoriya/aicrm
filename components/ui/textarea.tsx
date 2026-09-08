import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-2xl border border-white/8 bg-[#18181c] px-3.5 py-2.5 text-sm text-white transition-all outline-none placeholder:text-neutral-500 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/10 disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
