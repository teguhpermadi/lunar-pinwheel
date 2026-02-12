import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none mb-1 active:mb-0 active:mt-1",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_4px_0_0_#991b1b] active:translate-y-[2px] active:shadow-none mb-1",
                outline:
                    "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-[0_4px_0_0_var(--border)] active:translate-y-[2px] active:shadow-none mb-1",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_4px_0_0_#94a3b8] active:translate-y-[2px] active:shadow-none mb-1",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                game: "bg-green-500 text-white hover:bg-green-600 shadow-[0_4px_0_0_#15803d] active:translate-y-[2px] active:shadow-none mb-1 active:mb-0 active:mt-1 border-b-4 border-green-700",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-xl px-4",
                lg: "h-14 rounded-3xl px-10 text-lg",
                icon: "h-11 w-11",
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
