"use client"

import { AlertTriangle, Clock, Camera } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"

const ALERTS = [
    { id: 1, type: "VIOLENCE DETECTED", location: "CAM-04 (Parking Lot A)", time: "10:42 AM", date: "Today" },
    { id: 2, type: "SUSPICIOUS ACTIVITY", location: "CAM-01 (Main Entrance)", time: "09:15 AM", date: "Today" },
    { id: 3, type: "CROWD SURGE", location: "CAM-03 (Cafeteria)", time: "01:20 PM", date: "Yesterday" },
    { id: 4, type: "VIOLENCE DETECTED", location: "CAM-06 (Sports Complex)", time: "11:30 AM", date: "Yesterday" }
] as const;

export default function AlertsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Security Alerts</h2>
            </div>

            <div className="space-y-4">
                {ALERTS.map((alert, index) => (
                    <Card
                        key={alert.id}
                        className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm animate-in slide-in-from-right-4 fade-in fill-mode-backwards transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-red-500/20 hover:shadow-red-900/20 active:scale-[0.99] cursor-pointer group relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'VIOLENCE DETECTED' ? 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20' : 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20'}`}>
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-bold text-white">{alert.type}</h3>
                                        {alert.type === 'VIOLENCE DETECTED' && (
                                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-zinc-500 mt-1">
                                        <Camera className="h-3 w-3 mr-1" />
                                        {alert.location}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center justify-end text-sm text-zinc-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {alert.time}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">{alert.date}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
