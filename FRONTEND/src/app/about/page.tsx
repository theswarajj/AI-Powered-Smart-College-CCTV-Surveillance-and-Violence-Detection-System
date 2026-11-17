"use client"

import Link from "next/link"
import { ArrowLeft, Shield, Video, Bell, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50 p-8 space-y-8 animate-fade-in relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-between z-10">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-800 mb-2">
                        About <span className="text-blue-600">sentinelX AI</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl font-medium">
                        A state-of-the-art surveillance and violence detection system designed to ensure student safety.
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="gap-2 border-slate-200 bg-white shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 z-10">
                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 rounded-[2rem]">
                    <CardContent className="p-8 space-y-4">
                        <div className="p-4 bg-blue-50 w-fit rounded-xl">
                            <Shield className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Real-time Protection</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Our system utilizes advanced AI algorithms to monitor campus activity in real-time, instantly identifying potential threats and ensuring immediate response.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 rounded-[2rem]">
                    <CardContent className="p-8 space-y-4">
                        <div className="p-4 bg-blue-50 w-fit rounded-xl">
                            <Video className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Smart Surveillance</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Integrated CCTV network with multi-angle coverage, providing comprehensive monitoring of all key campus areas with high-definition clarity.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 rounded-[2rem]">
                    <CardContent className="p-8 space-y-4">
                        <div className="p-4 bg-orange-50 w-fit rounded-xl">
                            <Bell className="h-8 w-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Instant Alerts</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Automated alert system that triggers notifications to security personnel the moment abnormal behavior or violence is detected.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 rounded-[2rem]">
                    <CardContent className="p-8 space-y-4">
                        <div className="p-4 bg-purple-50 w-fit rounded-xl">
                            <Users className="h-8 w-8 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Student Safety</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Prioritizing the well-being of every student by creating a secure environment conducive to learning and personal growth.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center z-10">
                <p className="text-slate-400 font-semibold text-sm tracking-wide">
                    © 2026 sentinelX AI Inc. All rights reserved. • Version 1.0.0
                </p>
            </div>
        </div>
    )
}
