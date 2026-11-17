import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-slate-900 placeholder:text-slate-400 selection:bg-slate-900 selection:text-white bg-white border-slate-200 hover:border-slate-300 h-11 w-full min-w-0 rounded-xl border px-4 py-2 text-base shadow-sm transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-semibold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-slate-800",
        "focus-visible:border-slate-400 focus-visible:ring-slate-400/20 focus-visible:ring-[4px] focus-visible:bg-slate-50",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
