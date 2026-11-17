"use client"

import { usePathname } from "next/navigation"

export function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/login"

    return (
        <div className={isLoginPage ? "w-full" : "w-full md:pl-16 peer-hover:px-4 md:peer-hover:pl-[18.25rem] pt-4 pr-4 pb-4 transition-all duration-500 ease-in-out"}>
            {children}
        </div>
    )
}
