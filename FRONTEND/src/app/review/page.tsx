"use client"

import { useState } from "react"
import { Check, X, AlertOctagon } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReviewPage() {
    const [status, setStatus] = useState<"pending" | "correct" | "incorrect">("pending")

    const handleReview = (result: "correct" | "incorrect") => {
        setStatus(result)
        // Reset after animation
        setTimeout(() => setStatus("pending"), 2000)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto relative pt-8">

            {/* OVERLAY SIGNBOARD */}
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 pb-20 mt-16 mt-[-3rem]">
                <div className="relative w-full max-w-lg pb-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-[3rem] blur-2xl opacity-60 -z-10"></div>
                    <Card className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-12 w-full mx-auto relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <CardContent className="flex flex-col items-center justify-center space-y-6 p-0 relative z-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform duration-500 will-change-transform">
                                <AlertOctagon className="h-10 w-10 text-slate-400" />
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight text-slate-800">
                                Available Soon
                            </h2>
                            <p className="text-lg font-medium text-slate-500 max-w-xs leading-relaxed text-center">
                                The advanced Incident Review module is currently undergoing final quality assurance testing.
                            </p>
                            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide mt-4 border border-blue-100/50 shadow-sm">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                In Development
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* BACKGROUND CONTENT (BLURRED) */}
            <div className="opacity-30 blur-[4px] pointer-events-none select-none transition-all duration-500 space-y-6">
                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Incident Review</h2>
                    <p className="text-slate-500 font-medium">Human verification required for recent detections</p>
                </div>

                <Card className="bg-white border-none overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem]">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <AlertOctagon className="h-5 w-5 text-red-500" />
                                    <span className="text-red-500">Suspected Violence Detected</span>
                                </CardTitle>
                                <p className="text-sm font-medium text-slate-500">CAM-04 (Parking Lot) • 2 mins ago</p>
                            </div>
                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded uppercase">
                                Confidence: 89%
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="aspect-video w-full bg-slate-100 relative flex items-center justify-center">
                            {/* Placeholder Video Content */}
                            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                                <p className="text-slate-500 font-mono text-sm font-semibold">[ INCIDENT VIDEO PLAYBACK ]</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center gap-4">
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
                            disabled
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Correct Protection
                        </Button>
                        <Button
                            variant="destructive"
                            className="min-w-[150px]"
                            disabled
                        >
                            <X className="mr-2 h-4 w-4" />
                            False Positive
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
