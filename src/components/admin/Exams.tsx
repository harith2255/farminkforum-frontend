import React, { useEffect,useState,useCallback } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Upload, Folder, FileText, ArrowLeft, Plus } from "lucide-react";

const SUBJECTS = [
    { value: "agriculture", label: "Agriculture Extension Education" },
    { value: "adult", label: "Adult & Continuing Education" },
    { value: "education", label: "Education" },
    { value: "sociology", label: "Sociology" },
    { value: "rural-development", label: "Rural Development" },
    { value: "mass-communication-journalism", label: "Mass Communication & Journalism" },
    { value: "agriculture-statistics", label: "Agriculture Statistics" },
    { value: "agricultural-economics", label: "Agricultural Economics" },
    { value: "community-science", label: "Community Science" },
    { value: "agribusiness-management", label: "Agribusiness Management" },
    { value: "agriculture-marketing", label: "Agriculture Marketing" },
    { value: "other-agricultural-sciences", label: "Other Agricultural Sciences" },
    { value: "others", label: "Others" },
];

type PDFFile = {
    name: string;
    url: string;
    createdAt: number;
};

type SubjectFolder = {
    subject: string;
    notes: PDFFile[];
    exams: PDFFile[];
};

export default function ExamFolderSystem() {
    const [folders, setFolders] = useState<SubjectFolder[]>([]);
    const [screen, setScreen] = useState<"main" | "subject" | "notes" | "exams">("main");

    const [selectedSubject, setSelectedSubject] = useState<SubjectFolder | null>(null);
    const [viewPDF, setViewPDF] = useState<string | null>(null);

    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadSubject, setUploadSubject] = useState("");
    const [notePDF, setNotePDF] = useState<File | null>(null);
    const [examPDF, setExamPDF] = useState<File | null>(null);

    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    // -------------------------
    // Upload Handler
    // -------------------------
    const handleUpload = () => {
        if (!uploadSubject) return alert("Select subject");

        const subjectLabel = SUBJECTS.find((s) => s.value === uploadSubject)?.label;

        let newFolder = folders.find((f) => f.subject === subjectLabel);
        if (!newFolder) {
            newFolder = { subject: subjectLabel!, notes: [], exams: [] };
            folders.push(newFolder);
        }

        if (notePDF) {
            newFolder.notes.push({
                name: notePDF.name,
                url: URL.createObjectURL(notePDF),
                createdAt: Date.now(),
            });
        }

        if (examPDF) {
            newFolder.exams.push({
                name: examPDF.name,
                url: URL.createObjectURL(examPDF),
                createdAt: Date.now(),
            });
        }

        setFolders([...folders]);
        setUploadSubject("");
        setNotePDF(null);
        setExamPDF(null);
        setUploadOpen(false);
    };

    // -------------------------
    // Back Navigation
    // -------------------------
    const goBack = () => {
        if (screen === "subject") setScreen("main");
        else if (screen === "notes" || screen === "exams") setScreen("subject");
        else setScreen("main");
    };

    // -------------------------
    // Sorting
    // -------------------------
    const sortFiles = (files: PDFFile[]) => {
        return [...files].sort((a, b) =>
            sortOrder === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
        );
    };

    return (    
        <div className="space-y-6">
            
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-[#1d4d6a]">
                        Exams & Notes Management
                    </h2>
                    <p className="text-sm text-gray-500">
                        {folders.length === 0 ? "No subjects" : `${folders.length} subjects`}
                    </p>
                </div>

                <Button className="bg-[#1d4d6a] text-white" onClick={() => setUploadOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Exam
                </Button>
            </div>

            {/* Search + Sort */}
            <div className="flex gap-3">
                <Input
                    placeholder="Search subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border rounded-lg px-3 py-2"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            {/* MAIN SCREEN – SUBJECT LIST */}
            {screen === "main" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {folders
                        .filter((f) => f.subject.toLowerCase().includes(search.toLowerCase()))
                        .map((folder) => (
                            <Card
                                key={folder.subject}
                                className="cursor-pointer hover:shadow-md"
                                onClick={() => {
                                    setSelectedSubject(folder);
                                    setScreen("subject");
                                }}
                            >
                                <CardContent className="flex flex-col items-center p-6">
                                    <Folder className="w-12 h-12 text-[#1d4d6a]" />
                                    <p className="mt-3 font-medium">{folder.subject}</p>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            )}

            {/* SUBJECT SCREEN */}
            {screen === "subject" && selectedSubject && (
                <>
                    <Button variant="ghost" onClick={goBack}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>

                    <h3 className="text-lg font-semibold text-[#1d4d6a]">
                        {selectedSubject.subject}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <Card
                            className="cursor-pointer"
                            onClick={() => setScreen("notes")}
                        >
                            <CardContent className="flex flex-col items-center p-6">
                                <Folder className="w-12 h-12 text-[#1d4d6a]" />
                                Notes
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer"
                            onClick={() => setScreen("exams")}
                        >
                            <CardContent className="flex flex-col items-center p-6">
                                <Folder className="w-12 h-12 text-[#1d4d6a]" />
                                Exams
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* NOTES LIST */}
            {screen === "notes" && selectedSubject && (
                <>
                    <Button variant="ghost" onClick={goBack}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>

                    <h3 className="text-lg font-semibold text-[#1d4d6a]">
                        Notes – {selectedSubject.subject}
                    </h3>

                    <div className="space-y-3 mt-4">
                        {sortFiles(selectedSubject.notes).map((pdf, index) => (
                            <Card key={index}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <FileText />
                                        <p>{pdf.name}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewPDF(pdf.url)}
                                    >
                                        View
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* EXAMS LIST */}
            {screen === "exams" && selectedSubject && (
                <>
                    <Button variant="ghost" onClick={goBack}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>

                    <h3 className="text-lg font-semibold text-[#1d4d6a]">
                        Exams – {selectedSubject.subject}
                    </h3>

                    <div className="space-y-3 mt-4">
                        {sortFiles(selectedSubject.exams).map((pdf, index) => (
                            <Card key={index}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <FileText />
                                        <p>{pdf.name}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewPDF(pdf.url)}
                                    >
                                        View
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* PDF VIEWER */}
            {viewPDF && (
                <Dialog open={true} onOpenChange={() => setViewPDF(null)}>
                    <DialogContent className="max-w-4xl h-[80vh]">
                        <iframe src={viewPDF} className="w-full h-full" />
                    </DialogContent>
                </Dialog>
            )}

            {/* UPLOAD POPUP */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Exam / Notes</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                        <div>
                            <Label>Select Subject</Label>
                            <select
                                className="w-full border px-3 py-2 rounded-lg mt-1"
                                value={uploadSubject}
                                onChange={(e) => setUploadSubject(e.target.value)}
                            >
                                <option value="">Select</option>
                                {SUBJECTS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Upload Notes PDF</Label>
                            <Input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setNotePDF(e.target.files?.[0] || null)}
                            />
                        </div>

                        <div>
                            <Label>Upload Exam PDF</Label>
                            <Input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setExamPDF(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpload}>
                            <Upload className="w-4 h-4 mr-2" /> Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
