"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "neutral"
  dot?: boolean
}

function Badge({ 
  className, 
  variant = "primary", 
  dot = false,
  ...props 
}: BadgeProps) {
  const variants = {
    primary: "bg-blue-50 text-primary border-blue-100",
    secondary: "bg-sidebar-bg text-text-secondary border-border-main",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-red-50 text-red-600 border-red-100",
    neutral: "bg-gray-100 text-text-secondary border-gray-200"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-tighter transition-all group-hover:scale-[1.05]",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
      {props.children}
    </div>
  )
}

export { Badge }
