import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-white/8 bg-[#18181c] px-3.5 py-2 text-sm text-white transition-all outline-none placeholder:text-neutral-500 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/10 disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
