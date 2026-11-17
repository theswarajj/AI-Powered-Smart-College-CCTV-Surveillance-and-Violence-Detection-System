"use client"

import { Upload, Plus, Search, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STUDENTS = [
    { id: "STU-001", name: "Rahul Sharma", dept: "Computer Science", year: "3rd Year", email: "rahul.s@college.edu", status: "Active" },
    { id: "STU-002", name: "Priya Patel", dept: "Electronics", year: "2nd Year", email: "priya.p@college.edu", status: "Active" },
    { id: "STU-003", name: "Amit Kumar", dept: "Mechanical", year: "4th Year", email: "amit.k@college.edu", status: "Active" },
]

export default function StudentsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Student Database</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Registration Form */}
                <Card className="md:col-span-4 bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm h-fit transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-green-500/20 hover:shadow-green-900/10 cursor-pointer relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader>
                        <CardTitle>Register Student</CardTitle>
                        <CardDescription>Add new student details and face data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="studentid">Student ID</Label>
                            <Input id="studentid" placeholder="Ex: CS-2023-001" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cs">CS</SelectItem>
                                        <SelectItem value="it">IT</SelectItem>
                                        <SelectItem value="ece">ECE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Select>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st</SelectItem>
                                        <SelectItem value="2">2nd</SelectItem>
                                        <SelectItem value="3">3rd</SelectItem>
                                        <SelectItem value="4">4th</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="john@college.edu" className="bg-zinc-950 border-zinc-800" />
                        </div>

                        <div className="pt-2">
                            <Label className="mb-2 block">Face Data Upload</Label>
                            <div className="border-2 border-dashed border-zinc-800 rounded-lg p-6 bg-zinc-950/50 hover:bg-zinc-950 transition-colors cursor-pointer flex flex-col items-center justify-center text-center">
                                <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                                <p className="text-sm text-zinc-400">Drag images or click to upload</p>
                                <p className="text-xs text-zinc-600 mt-1">Min 5 images required</p>
                            </div>
                        </div>

                        <Button className="w-full bg-white text-black hover:bg-zinc-200 mt-4">
                            <Plus className="mr-2 h-4 w-4" /> Register Student
                        </Button>
                    </CardContent>
                </Card>

                {/* Student List */}
                <Card className="md:col-span-8 bg-zinc-900/90 border-zinc-800/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-500/20 hover:shadow-blue-900/10 cursor-pointer relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Registered Students</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input placeholder="Search students..." className="pl-8 bg-zinc-950 border-zinc-800 h-9" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="text-zinc-400">ID</TableHead>
                                    <TableHead className="text-zinc-400">Name</TableHead>
                                    <TableHead className="text-zinc-400">Department</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {STUDENTS.map((student) => (
                                    <TableRow key={student.id} className="border-zinc-800 hover:bg-zinc-950/50">
                                        <TableCell className="font-mono text-zinc-300">{student.id}</TableCell>
                                        <TableCell className="font-medium text-white">{student.name}</TableCell>
                                        <TableCell className="text-zinc-400">{student.dept} ({student.year})</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">
                                                {student.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
