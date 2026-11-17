"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

function TransitionOverlayContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const shouldTransition = searchParams.get('login_transition') === 'true'

    const [isVisible, setIsVisible] = useState(false)
    const [isFading, setIsFading] = useState(false)

    useEffect(() => {
        if (shouldTransition) {
            setIsVisible(true)

            // Wait 5 seconds before starting to fade
            const fadeTimer = setTimeout(() => {
                setIsFading(true)
            }, 5000)

            // Wait 6 seconds (5s hold + 1s fade) before removing
            const removeTimer = setTimeout(() => {
                setIsVisible(false)
                setIsFading(false)
                // Clean up the URL parameter
                router.replace(pathname)
            }, 6000)

            return () => {
                clearTimeout(fadeTimer)
                clearTimeout(removeTimer)
            }
        }
    }, [shouldTransition, pathname, router])

    if (!isVisible) return null

    return (
        <div
            className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0 -translate-x-full pointer-events-none' : 'opacity-100 translate-x-0 pointer-events-auto'
                }`}
            aria-hidden="true"
        >
            <div className="relative animate-breathe will-change-transform text-white text-center">
                <h1 className="text-6xl md:text-[8rem] font-bold tracking-tight select-none mb-4 md:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    sentinelX AI
                </h1>
            </div>
            <style jsx global>{`
                @keyframes breathe {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
                .animate-breathe {
                    animation: breathe 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}

export function TransitionOverlay() {
    return (
        <Suspense fallback={null}>
            <TransitionOverlayContent />
        </Suspense>
    )
}
