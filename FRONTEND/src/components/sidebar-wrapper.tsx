"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export function SidebarWrapper() {
    const pathname = usePathname()

    if (pathname === "/login") {
        return null
    }

    return (
        <div className="peer hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-[#0a0a0a] border-r border-white/5 w-16 hover:w-72 transition-[width] duration-500 ease-in-out overflow-hidden group shadow-2xl">
            <Sidebar />
        </div>
    )
}
