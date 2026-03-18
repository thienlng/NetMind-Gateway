import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-100 shadow-lg hover:bg-red-500/30 hover:border-red-400/50 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "bg-white/5 backdrop-blur-md border border-white/20 text-white shadow-sm hover:bg-white/15 hover:border-white/40 hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-white/5 backdrop-blur-md border border-white/15 text-white/80 shadow-sm hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "bg-transparent text-white/70 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/15",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
