"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'sidebar' | 'active'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  isActive?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isActive, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90",
      secondary: "bg-sidebar-bg border border-border-main text-text-main hover:bg-white",
      ghost: "text-text-secondary hover:text-text-main hover:bg-gray-50",
      danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
      sidebar: cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 font-bold",
        isActive ? "bg-white text-primary shadow-md" : "text-text-secondary hover:bg-white/50"
      ),
      active: "bg-primary text-white shadow-md"
    }

    const sizes = {
      sm: "px-4 py-1.5 text-xs font-bold rounded-lg",
      md: "px-6 py-2.5 text-sm font-bold rounded-xl",
      lg: "px-8 py-3 text-base font-black rounded-2xl",
      xl: "px-10 py-5 text-lg font-black rounded-[24px]",
      icon: "p-2 rounded-xl"
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
