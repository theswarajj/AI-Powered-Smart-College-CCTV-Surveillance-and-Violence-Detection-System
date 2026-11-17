"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Cctv,
    AlertTriangle,
    CheckSquare,
    Users,
    BarChart3,
    LogOut
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        hoverGlow: "hover:shadow-white/10",
    },
    {
        label: "Cameras",
        icon: Cctv,
        href: "/cameras",
        hoverGlow: "hover:shadow-white/10",
    },
    {
        label: "Alerts",
        icon: AlertTriangle,
        href: "/alerts",
        hoverGlow: "hover:shadow-red-500/10", // Kept a subtle red glow for alerts
    },
    {
        label: "Review",
        icon: CheckSquare,
        href: "/review",
        hoverGlow: "hover:shadow-white/10",
    },
    {
        label: "Students",
        icon: Users,
        href: "/students",
        hoverGlow: "hover:shadow-white/10",
    },
    {
        label: "Analytics",
        icon: BarChart3,
        href: "/analytics",
        hoverGlow: "hover:shadow-white/10",
    },
]

export function Sidebar() {
    const pathname = usePathname()

    if (pathname === "/login") {
        return null
    }

    return (
        <div className="relative h-full flex flex-col text-white w-72">
            {/* COLLAPSED STATE VERTICAL TEXT */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none pb-12">
                <span className="text-xl font-bold tracking-[0.2em] text-zinc-300 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
                    sentinelX AI
                </span>
            </div>

            {/* EXPANDED MENU */}
            <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col h-full w-72">
                <div className="px-5 py-6 flex-1">
                    <Link href="/about" className="flex items-center pl-3 mb-12 group/logo w-fit">
                        <div className="relative h-14 flex items-center transition-all duration-300 group-hover/logo:scale-105">
                            <span className="text-2xl font-bold tracking-tight text-white whitespace-nowrap">sentinelX AI</span>
                        </div>
                    </Link>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl border border-transparent",
                                    "transition-all duration-400 ease-out",
                                    "hover:text-white hover:bg-white/5 hover:border-white/10 hover:translate-x-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:backdrop-blur-md group/link",
                                    route.hoverGlow,
                                    pathname === route.href
                                        ? "text-white bg-white/[0.08] border-white/10 translate-x-1 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md"
                                        : "text-zinc-400"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon
                                        className={cn(
                                            "h-5 w-5 mr-3 shrink-0 transition-all duration-300",
                                            "group-hover/link:scale-110 group-hover/link:rotate-3"
                                        )}
                                    />
                                    <span className="transition-all duration-300 group-hover/link:tracking-wide whitespace-nowrap">
                                        {route.label}
                                    </span>
                                </div>
                                <div className={cn(
                                    "w-1 h-5 rounded-full transition-all duration-300 shrink-0",
                                    pathname === route.href
                                        ? "bg-white opacity-100"
                                        : "bg-white/50 opacity-0 group-hover/link:opacity-100"
                                )} />
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="px-5 pb-6">
                    <Link href="/login">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-zinc-400 border border-transparent",
                                "transition-all duration-300 ease-out",
                                "hover:text-white hover:bg-red-500/10 hover:border-red-500/20 hover:translate-x-1 group/logout",
                            )}
                        >
                            <LogOut className="h-5 w-5 mr-3 shrink-0 transition-transform duration-300 group-hover/logout:scale-110 group-hover/logout:-rotate-12" />
                            <span className="whitespace-nowrap transition-all duration-300 group-hover/logout:tracking-wide">Logout</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

