"use client"

import { useState } from "react"
import { Upload, Plus, Search, MoreHorizontal, CheckCircle2, Loader2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STUDENTS = [
    { id: "STU-001", name: "Rahul Sharma", dept: "Computer Science", year: "3rd Year", email: "rahul.s@college.edu", status: "Active" },
    { id: "STU-002", name: "Priya Patel", dept: "Electronics", year: "2nd Year", email: "priya.p@college.edu", status: "Active" },
    { id: "STU-003", name: "Amit Kumar", dept: "Mechanical", year: "4th Year", email: "amit.k@college.edu", status: "Active" },
]

export default function StudentsPage() {
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Please enter a valid name.' });
            return;
        }

        if (!file) {
            setMessage({ type: 'error', text: 'Please upload an image file.' });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("file", file);

            const res = await fetch("http://localhost:5000/api/add_face", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage({ type: 'success', text: `Successfully registered ${name}'s face in the database.` });
                setFile(null);
                setName("");
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'Failed to add face.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error connecting to the backend server.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Student Database</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Registration Form */}
                <Card className="md:col-span-4 bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2.5rem] h-fit transition-all duration-500 hover:-translate-y-1 cursor-pointer relative overflow-hidden group p-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="text-xl">Register Student</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Add new student details and face data to bypass alert system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-700 font-semibold">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="bg-slate-50 border-slate-100"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="pt-2">
                                <Label className="mb-2 block text-slate-700 font-semibold">Face Data Upload (Image Drop)</Label>
                                <div
                                    className={`border-2 border-dashed ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'} rounded-2xl p-6 transition-colors cursor-pointer flex flex-col items-center justify-center text-center relative`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    {file ? (
                                        <>
                                            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                            <p className="text-sm font-bold text-green-700 truncate w-full px-4">{file.name}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                            <p className="text-sm font-medium text-slate-500">Drag image or click to upload</p>
                                            <p className="text-xs font-semibold text-slate-400 mt-1">1 clear front-facing image required</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <Button disabled={isLoading} type="submit" className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 mt-4 shadow-md font-semibold overflow-hidden relative">
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                {isLoading ? "Registering & Training..." : "Register Student To FaceDB"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Student List */}
                <Card className="md:col-span-8 bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2.5rem] transition-all duration-500 hover:-translate-y-1 cursor-pointer relative overflow-hidden group p-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-xl">Registered Students</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search students..." className="pl-10 bg-slate-50 border-slate-100 shadow-sm h-10 rounded-xl" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="text-slate-500 font-semibold">Face</TableHead>
                                    <TableHead className="text-slate-500 font-semibold">ID</TableHead>
                                    <TableHead className="text-slate-500 font-semibold">Name</TableHead>
                                    <TableHead className="text-slate-500 font-semibold">Status</TableHead>
                                    <TableHead className="text-slate-500 font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {STUDENTS.map((student) => (
                                    <TableRow key={student.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                        <TableCell>
                                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                                                <User className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-slate-500 font-medium">{student.id}</TableCell>
                                        <TableCell className="font-bold text-slate-800">{student.name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-600">
                                                Enrolled in DB
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100">
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
