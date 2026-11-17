"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-[120px] -z-10 mix-blend-multiply opacity-50 animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-300/30 rounded-full blur-[100px] -z-10 mix-blend-multiply opacity-50 animate-pulse-glow" style={{ animationDelay: "1s" }} />

            {/* Left Navigation Arrow */}
            <Button
                variant="ghost"
                size="icon"
                noAnimation
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-slate-500 bg-white shadow-sm hover:shadow-md hover:bg-slate-50 hover:text-slate-800 rounded-full h-12 w-12"
            >
                <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* Right Navigation Arrow */}
            <Button
                variant="ghost"
                size="icon"
                noAnimation
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-slate-500 bg-white shadow-sm hover:shadow-md hover:bg-slate-50 hover:text-slate-800 rounded-full h-12 w-12"
            >
                <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="w-full max-w-[420px] p-8 md:p-10 space-y-8 bg-white/70 backdrop-blur-3xl border border-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] z-10 animate-fade-in relative">
                {/* Header */}
                <div className="text-center space-y-2 relative">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                        <span className="text-xl font-extrabold tracking-tighter text-slate-800">sX</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Enter your credentials to access your account.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ephraim@blocks.so"
                            className="h-12 bg-white border-slate-200 shadow-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400/20 focus-visible:border-slate-400 rounded-xl transition-all duration-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••••••"
                            className="h-12 bg-white border-slate-200 shadow-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400/20 focus-visible:border-slate-400 rounded-xl transition-all duration-300"
                        />
                    </div>

                    <div className="block w-full pt-4">
                        <Button
                            onClick={() => router.push("/dashboard?login_transition=true")}
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] border border-slate-800 hover:-translate-y-0.5"
                        >
                            Sign in
                        </Button>
                    </div>

                    <div className="text-center text-sm pt-2">
                        <span className="text-slate-500 font-medium">Forgot your password? </span>
                        <Link
                            href="#"
                            className="text-slate-800 hover:text-slate-900 hover:underline underline-offset-4 font-bold"
                        >
                            Reset password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
