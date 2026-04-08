"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: string[] | { label: string; value: string }[]
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-2 group">
        {label && (
          <label className="text-sm font-black text-text-secondary uppercase tracking-[0.15em] pl-1 group-focus-within:text-primary transition-colors">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "w-full bg-sidebar-bg border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-main appearance-none cursor-pointer outline-none transition-all hover:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5",
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((opt) => {
              const label = typeof opt === "string" ? opt : opt.label
              const value = typeof opt === "string" ? opt : opt.value
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none group-hover:text-primary transition-all" />
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
