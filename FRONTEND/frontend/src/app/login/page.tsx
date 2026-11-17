"use client"

import Link from "next/link"
import { ShieldCheck, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950" />
                <div className="h-full w-full grid grid-cols-[repeat(40,minmax(0,1fr))] opacity-20">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="border-r border-zinc-500/20 h-full" />
                    ))}
                </div>
            </div>

            <Card className="z-10 w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
                <CardHeader className="space-y-1 items-center text-center pb-8 border-b border-zinc-800/50">
                    <div className="h-16 w-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 ring-1 ring-zinc-700">
                        <ShieldCheck className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        SMARTCAMPUS Access
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Enter your credentials to access the surveillance system
                    </CardDescription>
                    <div className="pt-2">
                        <StatusBadge status="ONLINE" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-8">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input id="email" placeholder="security@college.edu" className="pl-10 bg-zinc-950/50 border-zinc-800 focus:border-green-500/50 focus:ring-green-500/20" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input id="password" type="password" className="pl-10 bg-zinc-950/50 border-zinc-800 focus:border-green-500/50 focus:ring-green-500/20" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4">
                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full bg-white text-black hover:bg-zinc-200 transition-all duration-200 font-semibold h-11">
                            Authenticate
                        </Button>
                    </Link>
                    <div className="text-center text-xs text-zinc-600 uppercase tracking-widest">
                        Restricted Access Center
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
