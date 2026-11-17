"use client"

import { Camera, MapPin } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"

const CAMERAS = [
    { id: "CAM-01", location: "Main Entrance", status: "SAFE" },
    { id: "CAM-02", location: "Library Corridor", status: "SAFE" },
    { id: "CAM-03", location: "Cafeteria", status: "SAFE" },
    { id: "CAM-04", location: "Parking Lot A", status: "SAFE" },
    { id: "CAM-05", location: "Science Block", status: "SAFE" },
    { id: "CAM-06", location: "Sports Complex", status: "SAFE" },
] as const;

export default function CamerasPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Camera Feed Network</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {CAMERAS.map((cam) => (
                    <Card key={cam.id} className="bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm overflow-hidden group hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl hover:shadow-green-500/20 hover:border-zinc-700/50 transition-all duration-300 cursor-pointer relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
                        <CardHeader className="p-0 relative z-10">
                            <div className="aspect-video w-full bg-zinc-950 relative flex items-center justify-center border-b border-zinc-800">
                                {/* Placeholder Texture */}
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 opacity-50" />
                                <Camera className="h-10 w-10 text-zinc-700 group-hover:text-zinc-500 transition-colors" />

                                {/* Status Overlay */}
                                <div className="absolute top-2 right-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20"></div>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-zinc-400 backdrop-blur-sm">
                                    1920x1080 • 30FPS
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-white">{cam.id}</div>
                                <StatusBadge status={cam.status} />
                            </div>
                            <div className="flex items-center text-sm text-zinc-500">
                                <MapPin className="h-4 w-4 mr-1 text-zinc-600" />
                                {cam.location}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 relative z-10">
                            <Button variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800" size="sm">
                                View Feed
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
