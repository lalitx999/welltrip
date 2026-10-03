import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // min-h-11 keeps the 44px touch target required by spec §7.1.
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#1B3B2B] text-[#FAF8F5] hover:bg-[#12291E] shadow-sm font-semibold",
        gold: "bg-[#C5A059] text-[#12291E] hover:bg-[#B38F48] shadow-sm font-bold",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm font-semibold",
        outline:
          "border border-[#E8E4DD] bg-white text-[#1B3B2B] hover:border-[#C5A059] hover:bg-[#FAF8F5] font-medium shadow-2xs",
        secondary:
          "bg-[#F4EFE6] text-[#1B3B2B] hover:bg-[#EAE3D5] font-medium",
        ghost: "text-[#26221F] hover:bg-[#F4EFE6] hover:text-[#1B3B2B]",
        link: "text-[#1B3B2B] underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
