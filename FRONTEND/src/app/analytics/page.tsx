"use client"

import { TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">System Analytics</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Detection Accuracy</CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800 tracking-tight">99.2%</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">+2.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">False Positives</CardTitle>
                        <TrendingDown className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800 tracking-tight">0.4%</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">-0.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Response Time</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800 tracking-tight">1.2s</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">Average detection speed</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500">Faces Indexed</CardTitle>
                        <Users className="h-5 w-5 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800 tracking-tight">2,450</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">+180 new records</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer relative overflow-hidden group p-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="text-xl">Violence Detection Trends</CardTitle>
                        <CardDescription className="font-medium text-slate-500">Monthly incident frequency analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Visual Placeholder for Chart */}
                        <div className="h-[240px] w-full flex items-end justify-between px-4 gap-2">
                            {[35, 45, 20, 50, 60, 45, 30, 70, 40, 55, 35, 25].map((h, i) => (
                                <div key={i} className="w-full bg-slate-100 hover:bg-green-100 transition-colors rounded-[0.5rem] rounded-b-none relative group/bar">
                                    <div
                                        style={{ height: `${h}%` }}
                                        className="absolute bottom-0 w-full bg-slate-200 group-hover/bar:bg-green-400 group-hover:bg-slate-300 transition-colors rounded-[0.5rem] rounded-b-none"
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-4 mt-4 text-xs font-bold text-slate-400 font-mono tracking-widest">
                            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                            <span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer relative overflow-hidden group p-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Activity Log</CardTitle>
                        <CardDescription className="font-medium text-slate-500">System events and user actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[
                                { text: "System Boot Sequence Completed", time: "10:00 AM", color: "bg-green-500" },
                                { text: "Camera 04 Connection Restored", time: "09:45 AM", color: "bg-blue-500" },
                                { text: "New Student Registered (STU-089)", time: "09:30 AM", color: "bg-slate-300" },
                                { text: "Backup Synchronization Finished", time: "09:00 AM", color: "bg-slate-300" },
                                { text: "Admin Login (Security Chief)", time: "08:55 AM", color: "bg-slate-800" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start">
                                    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full mr-4 shadow-sm ${item.color}`}></div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-semibold leading-none text-slate-700">{item.text}</p>
                                        <p className="text-xs font-medium text-slate-400">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
