"use client"

import { Camera, MapPin } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"

const CAMERAS = [
    { id: "CAM-01", location: "Main Detection Stream", status: "SAFE", feed: "http://localhost:5000/video_feed", isLive: true },
    { id: "CAM-02", location: "Library Corridor", status: "SAFE", feed: null, isLive: false },
    { id: "CAM-03", location: "Cafeteria", status: "SAFE", feed: null, isLive: false },
    { id: "CAM-04", location: "Parking Lot A", status: "SAFE", feed: null, isLive: false },
    { id: "CAM-05", location: "Science Block", status: "SAFE", feed: null, isLive: false },
    { id: "CAM-06", location: "Sports Complex", status: "SAFE", feed: null, isLive: false },
] as const;

export default function CamerasPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Camera Feed Network</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {CAMERAS.map((cam) => (
                    <Card key={cam.id} className="bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-500 cursor-pointer relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
                        <CardHeader className="p-0 relative z-10">
                            <div className="aspect-video w-full bg-slate-900 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                                {cam.feed ? (
                                    <>
                                        <img
                                            src={cam.feed}
                                            alt={cam.id}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                        <div className="absolute inset-0 hidden">
                                            <div className="flex items-center justify-center h-full w-full">
                                                <Camera className="h-10 w-10 text-slate-600 mb-2" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Placeholder Texture */}
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900 opacity-50" />
                                        <Camera className="h-10 w-10 text-slate-700 transition-colors z-10" />
                                        <span className="absolute mt-16 text-xs font-semibold text-slate-700 font-mono tracking-widest">OFFLINE</span>
                                    </>
                                )}

                                {/* Status Overlay */}
                                <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform">
                                    <div className={`h-3 w-3 rounded-full ${cam.isLive ? 'bg-green-500 animate-pulse ring-4 ring-green-500/20' : 'bg-slate-500'}`}></div>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-white/80 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-sm">
                                    1920x1080 • {cam.isLive ? '30FPS' : '0FPS'}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-slate-800 text-lg">{cam.id}</div>
                                <StatusBadge status={cam.status} />
                            </div>
                            <div className="flex items-center text-sm font-medium text-slate-500">
                                <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                                {cam.location}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 relative z-10">
                            <Button variant="ghost" className="w-full text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100 rounded-xl group-hover:bg-slate-50 transition-colors">
                                {cam.isLive ? 'View Detection Stream' : 'Reconnect Feed'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
