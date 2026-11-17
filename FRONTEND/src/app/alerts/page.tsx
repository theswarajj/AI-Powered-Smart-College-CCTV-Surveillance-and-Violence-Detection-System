"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Camera, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type AlertEvent = {
    frame_idx: number;
    track_id: number;
    prob: string;
    bbox: number[];
    source: string;
    name: string;
    face_conf: string;
    timestamp: string;
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/events?n=50");
                if (res.ok) {
                    const data = await res.json();
                    setAlerts(data);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };

        const interval = setInterval(fetchEvents, 2000);
        fetchEvents();
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Security Alerts</h2>
            </div>

            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 font-medium tracking-wide">
                        NO ACTIVE ALERTS
                    </div>
                ) : (
                    alerts.map((alert, index) => {
                        const probNum = parseFloat(alert.prob);
                        return (
                            <Card
                                key={`${alert.track_id}-${alert.timestamp}`}
                                className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] animate-in slide-in-from-right-4 fade-in fill-mode-backwards transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                                style={{ animationDelay: `${(index % 10) * 100}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-red-100 text-red-600 ring-1 ring-red-200`}>
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-bold text-slate-800">
                                                    VIOLENCE DETECTED ({(probNum * 100).toFixed(0)}%)
                                                </h3>
                                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                                            </div>
                                            <div className="flex items-center text-sm font-medium text-slate-500 mt-1 space-x-3">
                                                <span className="flex items-center">
                                                    <Camera className="h-4 w-4 mr-1 text-slate-400" />
                                                    {alert.source || "Camera Feed"}
                                                </span>
                                                <span className="flex items-center">
                                                    <User className="h-4 w-4 mr-1 text-slate-400" />
                                                    {alert.name !== "Unknown" ? (
                                                        <span className="text-blue-600 font-bold">{alert.name}</span>
                                                    ) : (
                                                        <span>Unknown Identity</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center justify-end text-sm font-medium text-slate-500">
                                            <Clock className="h-4 w-4 mr-1 text-slate-400" />
                                            {alert.timestamp ? alert.timestamp.split(" ")[1] : "--"}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-400 mt-1">
                                            {alert.timestamp ? alert.timestamp.split(" ")[0] : "--"}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    )
}
