import React, { useState } from "react";
import { Folder, UploadCloud } from "lucide-react";

interface FolderItem {
    id: number;
    name: string;
}

const folderData: FolderItem[] = [
    { id: 1, name: "Agriculture" },
    { id: 2, name: "Science" },
    { id: 3, name: "Rural Development" },
    { id: 4, name: "Adult Education" },
];

/* Dummy PDF URLs */
const samplePDFs = [
    { name: "SampleNotes1.pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
    { name: "SampleNotes2.pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
];

const defaultExamPDFs = [
    { name: "ExamPaper1.pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
];

/* -------------------------------------------
    FILE UPLOAD COMPONENT
----------------------------------------------*/
const FileUpload = ({
    label,
    onUpload,
}: {
    label: string;
    onUpload: (files: FileList) => void;
}) => (
    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:border-[#bf2026] transition cursor-pointer">
        <UploadCloud className="w-10 h-10 text-[#bf2026] mb-3" />
        <p className="font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-400">PDF format only</p>
        <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && onUpload(e.target.files)}
        />
    </label>
);

export default function FixedFolderGrid() {
    const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
    const [insideSub, setInsideSub] = useState<"notes" | "exam" | null>(null);

    const [notesPDFs, setNotesPDFs] = useState<File[]>([]);
    const [examPDFs, setExamPDFs] = useState<File[]>([]);
    const [examText, setExamText] = useState("");

    const [viewPDF, setViewPDF] = useState<string | null>(null);
    const [viewFileURL, setViewFileURL] = useState<string | null>(null);
    const [attendPDF, setAttendPDF] = useState<string | null>(null);

    // -------------------- Navigation --------------------
    const openFolder = (item: FolderItem) => {
        setSelectedFolder(item);
        setInsideSub(null);
    };

    const goBack = () => {
        if (attendPDF) setAttendPDF(null);
        else if (viewPDF) {
            setViewPDF(null);
            setViewFileURL(null);
        } else if (insideSub) setInsideSub(null);
        else setSelectedFolder(null);
    };

    // -------------------- File Handling --------------------
    const handlePDFUpload = (files: FileList, type: "notes" | "exam") => {
        const newFiles = Array.from(files);
        if (type === "notes") setNotesPDFs((prev) => [...prev, ...newFiles]);
        else setExamPDFs((prev) => [...prev, ...newFiles]);
    };

    const handleViewPDF = (file: string | File, url?: string) => {
        if (file instanceof File) {
            setViewFileURL(URL.createObjectURL(file));
            setViewPDF(file.name);
        } else {
            setViewFileURL(url || file); // Use dummy URL if provided
            setViewPDF(file);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h2 className="text-[#1d4d6a] mb-1 text-lg font-semibold">Study Resources</h2>
                <p className="text-sm text-gray-500">
                    Access all your notes, PDFs, and exam materials in one organized space.
                </p>
            </div>

            {/* ---------------- MAIN FOLDER GRID ---------------- */}
            {!selectedFolder && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mt-6 gap-6">
                    {folderData.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => openFolder(item)}
                            className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-white rounded-xl shadow hover:shadow-lg cursor-pointer transition"
                        >
                            <Folder className="w-20 h-20 text-[#bf2026] mb-3" />
                            <p className="text-sm font-medium">{item.name}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ---------------- INSIDE MAIN FOLDER ---------------- */}
            {selectedFolder && !insideSub && (
                <div className="mt-6">
                    <button
                        onClick={goBack}
                        className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                        ← Back
                    </button>

                    <h3 className="text-xl font-semibold text-[#1d4d6a] mb-4">{selectedFolder.name}</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {/* Notes */}
                        <div
                            onClick={() => setInsideSub("notes")}
                            className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-white rounded-xl shadow hover:shadow-lg cursor-pointer transition"
                        >
                            <Folder className="w-12 h-12 text-[#bf2026] mb-3" />
                            <p className="font-medium">Notes</p>
                        </div>

                        {/* Exam */}
                        <div
                            onClick={() => setInsideSub("exam")}
                            className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-white rounded-xl shadow hover:shadow-lg cursor-pointer transition"
                        >
                            <Folder className="w-12 h-12 text-[#bf2026] mb-3" />
                            <p className="font-medium">Exam</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- NOTES VIEW ---------------- */}
            {insideSub === "notes" && (
                <div className="mt-6">
                    <button
                        onClick={goBack}
                        className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                        ← Back
                    </button>

                    <h3 className="text-xl font-semibold text-[#1d4d6a] mb-4">Notes PDFs</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-4">
                        {samplePDFs.map((file, idx) => (
                            <div
                                key={idx}
                                className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-gray-100 rounded-xl shadow p-4 cursor-pointer hover:bg-gray-200 transition"
                            >
                                <span className="text-3xl mb-2">📄</span>
                                <p className="text-sm font-medium text-center">{file.name}</p>
                                <button
                                    onClick={() => handleViewPDF(file.name, file.url)}
                                    className="mt-3 px-3 py-1 bg-[#bf2026] hover:bg-[#a01c22]  text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    View Now
                                </button>
                            </div>
                        ))}

                        {notesPDFs.map((file, idx) => (
                            <div
                                key={idx}
                                className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-gray-100 rounded-xl shadow p-4 cursor-pointer hover:bg-gray-200 transition"
                            >
                                <span className="text-3xl mb-2">📄</span>
                                <p className="text-sm font-medium text-center">{file.name}</p>
                                <button
                                    onClick={() => handleViewPDF(file)}
                                    className="mt-3 px-3 py-1 bg-[#bf2026] text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    View Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ---------------- EXAM VIEW ---------------- */}
            {insideSub === "exam" && (
                <div className="mt-6">
                    <button
                        onClick={goBack}
                        className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                        ← Back
                    </button>

                    <h3 className="text-xl font-semibold text-[#1d4d6a] mb-4">Exam Materials</h3>

                    {!attendPDF && !viewPDF && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-4">
                            {[...defaultExamPDFs, ...examPDFs.map((f) => ({ name: f.name, url: "" }))].map(
                                (file, idx) => (
                                    <div
                                        key={idx}
                                        className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-gray-100 rounded-xl shadow p-4 cursor-pointer hover:bg-gray-200 transition"
                                    >
                                        <span className="text-3xl mb-2">📄</span>
                                        <p className="text-sm font-medium text-center">{file.name}</p>
                                        <div className="flex space-x-2 mt-3">
                                            <button
                                                onClick={() => handleViewPDF(file.name, file.url)}
                                                className="px-3 py-1 bg-[#bf2026] text-white rounded hover:bg-[#a01c22] text-sm"
                                            >
                                                View Now
                                            </button>
                                            <button
                                                onClick={() => setAttendPDF(file.name)}
                                                className="px-3 py-1 bg-[#1d4d6a] text-white rounded hover:bg-[#a01c22] text-sm"
                                            >
                                                Attend
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* View PDF Modal */}
                    {viewPDF && viewFileURL && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-xl w-3/4 h-3/4 relative flex flex-col">
                                <button
                                    onClick={() => {
                                        setViewPDF(null);
                                        setViewFileURL(null);
                                    }}
                                    className="absolute top-3 right-3 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Close
                                </button>
                                <h3 className="text-lg font-semibold mb-4">{viewPDF}</h3>
                                <iframe src={viewFileURL} className="w-full h-full" title="PDF Viewer" />
                            </div>
                        </div>
                    )}

                    {/* Attend Interface */}
                    {attendPDF && (
                        <div className="mt-4 bg-gray-50 p-6 rounded-xl">
                            <h3
                                className="text-lg font-semibold text-[#bf2026] mb-4 cursor-pointer hover:underline"
                                onClick={() => {
                                    const pdfURL = defaultExamPDFs.find((f) => f.name === attendPDF)?.url;
                                    if (pdfURL) {
                                        window.open(pdfURL, "_blank"); // Open in new tab
                                    }
                                }}
                            >
                                Attend: {attendPDF}
                            </h3>


                            <FileUpload
                                label="Upload your Answer PDF"
                                onUpload={(files) => handlePDFUpload(files, "exam")}
                            />

                            <textarea
                                value={examText}
                                onChange={(e) => setExamText(e.target.value)}
                                className="mt-6 w-full p-3 border rounded-lg"
                                rows={6}
                                placeholder="Write your answers here..."
                            />

                            <button
                                onClick={() => setAttendPDF(null)}
                                className="mt-4 px-4 py-2 bg-[#bf2026] text-white rounded hover:bg-[#a01c22]"
                            >
                                Submit
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
