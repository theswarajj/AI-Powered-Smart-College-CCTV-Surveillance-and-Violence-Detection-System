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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Incident Review</h2>
                <p className="text-zinc-500">Human verification required for recent detections</p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden shadow-2xl transition-all duration-200 hover:scale-[1.01]">
                <CardHeader className="border-b border-zinc-800 bg-zinc-950/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <AlertOctagon className="h-5 w-5 text-red-500" />
                                <span className="text-red-500">Suspected Violence Detected</span>
                            </CardTitle>
                            <p className="text-sm text-zinc-500">CAM-04 (Parking Lot) • 2 mins ago</p>
                        </div>
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded uppercase">
                            Confidence: 89%
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                        {/* Placeholder Video Content */}
                        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                            <p className="text-zinc-600 font-mono text-sm">[ INCIDENT VIDEO PLAYBACK ]</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-center gap-4">
                    {status === "pending" ? (
                        <>
                            <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
                                onClick={() => handleReview("correct")}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Correct Protection
                            </Button>
                            <Button
                                variant="destructive"
                                className="min-w-[150px]"
                                onClick={() => handleReview("incorrect")}
                            >
                                <X className="mr-2 h-4 w-4" />
                                False Positive
                            </Button>
                        </>
                    ) : (
                        <div className={`text-lg font-bold animate-in zoom-in duration-300 ${status === "correct" ? "text-green-500" : "text-red-500"}`}>
                            {status === "correct" ? "VERIFIED CORRECT" : "MARKED AS FALSE POSITIVE"}
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
