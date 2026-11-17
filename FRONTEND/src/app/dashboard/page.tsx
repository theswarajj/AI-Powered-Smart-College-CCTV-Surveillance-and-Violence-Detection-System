"use client"

import { useState, useEffect } from "react"
import { Activity, Camera, AlertTriangle, ShieldCheck } from "lucide-react"

import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
    const [stats, setStats] = useState<{ active_tracks?: number, total_alerts?: number, fps?: number, global_fight?: boolean }>({});

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        };

        const interval = setInterval(fetchStats, 1000);
        return () => clearInterval(interval);
    }, []);

    const isAlert = stats.global_fight;

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

            <div className="grid gap-6">
                {/* Top Row Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-[#e0c3fc] to-[#f4e4ff] border-none shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6 rounded-[2rem]">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <h3 className="text-sm font-semibold text-slate-700">Live FPS</h3>
                            <Camera className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-800 mb-2">{stats.fps?.toFixed(1) || "0.0"}</div>
                            <p className="text-sm font-medium text-slate-600">Active Pipeline Rate</p>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#b2f2f2] to-[#e0fbfb] border-none shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6 rounded-[2rem]">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <h3 className="text-sm font-semibold text-slate-700">Total Alerts</h3>
                            <Activity className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                            <div className={`text-4xl font-bold mb-2 ${stats.total_alerts && stats.total_alerts > 0 ? "text-red-500" : "text-slate-800"}`}>
                                {stats.total_alerts || 0}
                            </div>
                            <p className="text-sm font-medium text-slate-600">Since session start</p>
                        </div>
                    </Card>

                    <Card className={`border-none shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6 rounded-[2rem] ${isAlert ? "bg-red-50" : "bg-white"}`}>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <h3 className="text-sm font-semibold text-slate-700">System Status</h3>
                            <ShieldCheck className={`h-5 w-5 ${isAlert ? "text-red-600" : "text-slate-700"}`} />
                        </div>
                        <div>
                            <div className={`text-4xl font-bold mb-2 ${isAlert ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
                                {isAlert ? "THREAT DETECTED" : "SECURE"}
                            </div>
                            <p className={`text-sm font-medium ${isAlert ? "text-red-500" : "text-slate-500"}`}>
                                {isAlert ? "Violence detected on cameras" : "No threats detected"}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Main Camera Feed Card */}
                <Card className={`bg-white border-2 ${isAlert ? "border-red-500/50" : "border-transparent"} shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 rounded-[2.5rem] p-8`}>
                    <div className="flex flex-row items-center justify-between pb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">Live Feed</h3>
                            <p className="text-slate-500 font-medium">CAM-01 (Main Detection Stream)</p>
                        </div>
                        <StatusBadge status={isAlert ? "DANGER" : "SAFE"} />
                    </div>
                    <div className="aspect-video w-full rounded-2xl bg-black relative overflow-hidden flex items-center justify-center border border-slate-200 group shadow-inner">
                        <img
                            src="http://localhost:5000/video_feed"
                            alt="Live Feed"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // If backend is offline, show placeholder
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />

                        {/* Offline Placeholder */}
                        <div className="absolute inset-0 hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20"></div>
                            <div className="flex flex-col items-center justify-center h-full w-full transition-opacity duration-500 gap-3">
                                <div className="p-4 bg-slate-800 rounded-full shadow-sm relative z-10">
                                    <Camera className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-xs text-slate-400 font-semibold tracking-widest text-center">FEED UNAVAILABLE<br />Check Backend Server</p>
                            </div>
                        </div>

                        {/* Rec indicator */}
                        <div className="absolute top-6 right-6 flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-white">
                            <div className={`h-2 w-2 rounded-full ${isAlert ? "bg-red-500 animate-ping" : "bg-green-500"}`}></div>
                            <span className="text-xs font-bold tracking-wider">LIVE</span>
                        </div>

                        {/* Timestamp */}
                        <div suppressHydrationWarning className="absolute bottom-6 left-6 text-xs font-semibold tracking-wider text-slate-300 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                            {new Date().toISOString().split('T')[0]} <span className="text-white pl-2">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-12 text-sm font-medium border-t border-slate-100 pt-6">
                        <div className="text-slate-500 flex flex-col gap-1">
                            <span>Detected Persons</span>
                            <span className="text-slate-800 text-lg font-bold">{stats.active_tracks || 0}</span>
                        </div>
                        <div className="text-slate-500 flex flex-col gap-1">
                            <span>Global Status</span>
                            <span className={`${isAlert ? "text-red-500" : "text-green-500"} text-lg font-bold`}>
                                {isAlert ? "THREAT DETECTED" : "NORMAL"}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
