"use client"

import { TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">System Analytics</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:bg-zinc-800/80 hover:border-green-500/20 hover:shadow-lg hover:shadow-green-900/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Detection Accuracy</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">99.2%</div>
                        <p className="text-xs text-zinc-500">+2.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:bg-zinc-800/80 hover:border-green-500/20 hover:shadow-lg hover:shadow-green-900/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">False Positives</CardTitle>
                        <TrendingDown className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">0.4%</div>
                        <p className="text-xs text-zinc-500">-0.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:bg-zinc-800/80 hover:border-zinc-700/50 hover:shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Response Time</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">1.2s</div>
                        <p className="text-xs text-zinc-500">Average detection speed</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:bg-zinc-800/80 hover:border-zinc-700/50 hover:shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Faces Indexed</CardTitle>
                        <Users className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">2,450</div>
                        <p className="text-xs text-zinc-500">+180 new records</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-green-500/20 hover:shadow-green-900/10 cursor-pointer relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader>
                        <CardTitle>Violence Detection Trends</CardTitle>
                        <CardDescription>Monthly incident frequency analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Visual Placeholder for Chart */}
                        <div className="h-[240px] w-full flex items-end justify-between px-4 gap-2">
                            {[35, 45, 20, 50, 60, 45, 30, 70, 40, 55, 35, 25].map((h, i) => (
                                <div key={i} className="w-full bg-zinc-800 hover:bg-green-500/50 transition-colors rounded-t relative group">
                                    <div
                                        style={{ height: `${h}%` }}
                                        className="absolute bottom-0 w-full bg-zinc-700 group-hover:bg-green-500 transition-colors rounded-t"
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-4 mt-2 text-xs text-zinc-500 font-mono">
                            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                            <span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-500/20 hover:shadow-blue-900/10 cursor-pointer relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader>
                        <CardTitle>Recent Activity Log</CardTitle>
                        <CardDescription>System events and user actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { text: "System Boot Sequence Completed", time: "10:00 AM", color: "text-green-500" },
                                { text: "Camera 04 Connection Restored", time: "09:45 AM", color: "text-blue-500" },
                                { text: "New Student Registered (STU-089)", time: "09:30 AM", color: "text-zinc-400" },
                                { text: "Backup Synchronization Finished", time: "09:00 AM", color: "text-zinc-400" },
                                { text: "Admin Login (Security Chief)", time: "08:55 AM", color: "text-white" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`h-2 w-2 rounded-full mr-4 ${item.color.replace('text-', 'bg-')}`}></div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none text-zinc-300">{item.text}</p>
                                        <p className="text-xs text-zinc-500">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
