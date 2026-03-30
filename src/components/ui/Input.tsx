"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-main file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary outline-none transition-all placeholder:font-medium focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
            icon && "pl-12",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
