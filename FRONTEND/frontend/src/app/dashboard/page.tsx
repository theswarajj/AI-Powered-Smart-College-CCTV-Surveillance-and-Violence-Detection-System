"use client"

import { Activity, Camera, AlertTriangle, ShieldCheck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="border-red-500/20 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Emergency Protocol
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 lg:col-span-5 bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:border-green-500/20 hover:shadow-green-900/20 active:scale-[0.99] cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Live Feed • CAM-01 (Main Entrance)
                        </CardTitle>
                        <StatusBadge status="SAFE" />
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video w-full rounded-md bg-zinc-950 border border-zinc-800 relative overflow-hidden flex items-center justify-center group">
                            {/* Grid overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                            {/* Center pulsing indicator */}
                            <div className="flex flex-col items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="relative flex items-center justify-center mb-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-20 duration-1000"></span>
                                    <Camera className="h-12 w-12 text-zinc-700" />
                                </div>
                                <p className="text-sm text-zinc-500 font-mono">LIVE SIGNAL ACTIVE</p>
                            </div>

                            {/* Rec indicator */}
                            <div className="absolute top-4 right-4 flex items-center space-x-2">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-red-500">REC</span>
                            </div>

                            {/* Timestamp */}
                            <div className="absolute bottom-4 left-4 text-xs font-mono text-zinc-400">
                                {new Date().toISOString().split('T')[0]} <span className="text-white">10:42:15 AM</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <div className="text-zinc-400">
                                Prediction: <span className="text-white font-mono">NO VIOLENCE</span>
                            </div>
                            <div className="text-zinc-400">
                                Confidence: <span className="text-green-500 font-mono">98.5%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="col-span-4 lg:col-span-2 space-y-4">
                    {/* Stats Cards */}
                    <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-zinc-800/80 hover:border-zinc-700/50 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Total Cameras</CardTitle>
                            <Camera className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">12</div>
                            <p className="text-xs text-zinc-500">12 online / 0 offline</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-zinc-800/80 hover:border-red-500/20 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Active Alerts</CardTitle>
                            <Activity className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">0</div>
                            <p className="text-xs text-zinc-500">System Normal</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-zinc-800/80 hover:border-green-500/20 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">System Status</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">SECURE</div>
                            <p className="text-xs text-zinc-500">No threats detected</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
