import { cn } from "@/lib/utils"

interface StatusBadgeProps {
    status: "SAFE" | "DANGER" | "VIOLENCE DETECTED" | "ONLINE" | "OFFLINE"
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const isDanger = status === "DANGER" || status === "VIOLENCE DETECTED"
    const isOnline = status === "ONLINE" || status === "SAFE"

    return (
        <div
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                isDanger && "bg-red-500/10 text-red-500 border border-red-500/20",
                isOnline && "bg-green-500/10 text-green-500 border border-green-500/20",
                status === "OFFLINE" && "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
                className
            )}
        >
            <span className={cn("relative flex h-2 w-2 mr-2")}>
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isDanger ? "bg-red-500" : isOnline ? "bg-green-500" : "hidden"
                )}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2",
                    isDanger ? "bg-red-500" : isOnline ? "bg-green-500" : "bg-zinc-500"
                )}></span>
            </span>
            {status}
        </div>
    )
}
