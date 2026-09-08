import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black font-semibold hover:bg-neutral-200 shadow-sm border border-white/20",
        secondary:
          "bg-[#222226] text-neutral-200 hover:bg-[#2c2c32] hover:text-white border border-white/5",
        outline:
          "border border-white/10 bg-[#121215] text-neutral-300 hover:bg-[#1a1a1e] hover:text-white hover:border-white/20",
        ghost:
          "text-neutral-400 hover:bg-[#1f1f23] hover:text-neutral-100",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-4 py-2 text-xs",
        xs: "h-6.5 gap-1.5 rounded-full px-2.5 text-[11px]",
        sm: "h-8 gap-1.5 rounded-full px-3 text-xs",
        lg: "h-10 gap-2 rounded-full px-5 text-sm",
        icon: "size-8.5 rounded-full",
        "icon-xs": "size-6.5 rounded-full",
        "icon-sm": "size-7.5 rounded-full",
        "icon-lg": "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
