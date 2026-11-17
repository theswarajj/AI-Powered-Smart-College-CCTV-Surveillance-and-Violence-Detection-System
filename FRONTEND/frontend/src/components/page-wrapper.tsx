"use client"

import { usePathname } from "next/navigation"

export function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/login"

    return (
        <div className={isLoginPage ? "w-full" : "md:pl-72 pt-4 pr-4 pb-4"}>
            {children}
        </div>
    )
}
