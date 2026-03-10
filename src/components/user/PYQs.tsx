import React, { useState,useEffect } from "react";
import { Search, Filter, ChevronDown, BookOpen, Folder, ChevronRight, FolderOpen, FileText, Eye, FileQuestion, CheckCircle } from "lucide-react";



const BASE_URL = `${import.meta.env.VITE_API_URL}/api/pyq`;
const authFetch = (url) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

function PYQSection() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("All Subjects");
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [currentView, setCurrentView] = useState("subjects");
    const [selectedSubjectData, setSelectedSubjectData] = useState(null);
    const [selectedYearFolder, setSelectedYearFolder] = useState(null);
    const [subjects, setSubjects] = useState([]);


    useEffect(() => {
  fetchSubjects();
}, []);

const fetchSubjects = async () => {
  try {
    const res = await authFetch(`${BASE_URL}/subjects`);
    if (!res.ok) throw new Error("Failed to load subjects");

    const data = await res.json();
    setSubjects(
      data.map(s => ({
        id: s.id,
        name: s.name,
        folders: [],
      }))
    );
  } catch (err) {
    console.error(err);
    alert("Unable to load subjects");
  }
};



    const filterOptions = ["All Subjects", ...subjects.map(subject => subject.name)];

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSubjectSelect = (subject) => {
        setSelectedSubject(subject);
        setShowSubjectDropdown(false);
    };

  const openSubject = async (subject) => {
  try {
    const res = await authFetch(
      `${BASE_URL}/subjects/${subject.id}/folders`
    );
    if (!res.ok) throw new Error("Failed to load year folders");

    const folders = await res.json();

    setSelectedSubjectData({ ...subject, folders });
    setCurrentView("yearFolders");
  } catch (err) {
    console.error(err);
    alert("Unable to load year folders");
  }
};

   const openYearFolder = async (folder) => {
  try {
    const res = await authFetch(
      `${BASE_URL}/subjects/${selectedSubjectData.id}/papers/${folder.start}/${folder.end}`
    );
    if (!res.ok) throw new Error("Failed to load papers");

    const data = await res.json();

    setSelectedYearFolder({
      ...folder,
      papers: data.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        year: p.year,
        fileUrl: p.file_url,
        fileSize: p.file_size,
      })),
    });

    setCurrentView("papers");
  } catch (err) {
    console.error(err);
    alert("Unable to load papers");
  }
};



    const goBackToSubjects = () => {
        setCurrentView("subjects");
        setSelectedSubjectData(null);
        setSelectedYearFolder(null);
    };

    const goBackToYearFolders = () => {
        setCurrentView("yearFolders");
        setSelectedYearFolder(null);
    };

   const handleViewPaper = (paper) => {
  if (!paper?.fileUrl) {
    alert("File not available");
    return;
  }

  window.open(paper.fileUrl, "_blank", "noopener,noreferrer");
};


    const filteredSubjects = selectedSubject === "All Subjects" 
        ? subjects 
        : subjects.filter(subject => subject.name === selectedSubject);

    return (
        <div className="space-y-6 p-4 sm:p-0">
            {/* Header Row with Heading and Search/Filter */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Heading and Tagline */}
                <div className="lg:max-w-[50%]">
                    <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">
                        Previous Year Questions
                    </h2>
                    <p className="text-sm text-gray-500">Master the Past, Conquer the Future.</p>
                </div>

                {/* Right: Search and Filter - Now in same row on desktop */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* Search Bar */}
                    <div className="flex-1 lg:flex-none lg:w-80">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search subjects or topics..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Subject Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                        >
                            <Filter className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-700 text-sm truncate max-w-[150px]">{selectedSubject}</span>
                            <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showSubjectDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowSubjectDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Filter by Subject
                                        </div>
                                        {filterOptions.map((subject, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSubjectSelect(subject)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-gray-100 transition-colors text-sm ${selectedSubject === subject ? 'bg-blue-50 text-[#1d4d6a]' : 'text-gray-700'}`}
                                            >
                                                <BookOpen className="h-3.5 w-3.5" />
                                                <span className="font-medium truncate">{subject}</span>
                                                {selectedSubject === subject && (
                                                    <div className="ml-auto w-1.5 h-1.5 bg-[#1d4d6a] rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <button 
                    onClick={goBackToSubjects}
                    className={`hover:text-[#1d4d6a] ${currentView === "subjects" ? "text-gray-400 cursor-default" : ""}`}
                    disabled={currentView === "subjects"}
                >
                    Subjects
                </button>
                {currentView === "yearFolders" && selectedSubjectData && (
                    <>
                        <span>›</span>
                        <span className="text-[#1d4d6a] font-medium">{selectedSubjectData.name}</span>
                    </>
                )}
                {currentView === "papers" && selectedYearFolder && (
                    <>
                        <span>›</span>
                        <button 
                            onClick={goBackToYearFolders}
                            className="hover:text-[#1d4d6a]"
                        >
                            {selectedSubjectData?.name}
                        </button>
                        <span>›</span>
                        <span className="text-[#1d4d6a] font-medium">{selectedYearFolder.name}</span>
                    </>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            {currentView === "subjects" ? (
                /* ========== SUBJECTS VIEW ========== */
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {selectedSubject === "All Subjects" ? "All Subjects" : selectedSubject}
                        </h3>
                        <span className="text-sm text-gray-500">
                            {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSubjects.map((subject) => (
                            <div 
                                key={subject.id} 
                                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group"
                                onClick={() => openSubject(subject)}
                            >
                                <div className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                <Folder className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800 group-hover:text-[#1d4d6a] transition-colors">
                                                    {subject.name}
                                                </h4>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#1d4d6a] transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredSubjects.length === 0 && (
                        <div className="text-center py-12">
                            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                                <Folder className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No subjects found</h3>
                            {/* <p className="text-gray-500">Try a different search or select "All Subjects"</p> */}
                        </div>
                    )}
                </div>
            ) : currentView === "yearFolders" ? (
                /* ========== YEAR FOLDERS VIEW ========== */
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <button
                                onClick={goBackToSubjects}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1d4d6a] mb-2"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                                Back to Subjects
                            </button>
                            <h3 className="text-lg font-semibold text-gray-800">
                                {selectedSubjectData?.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Select a year range to view question papers
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedSubjectData?.folders.map((folder) => (
                            <div 
                                key={folder.id} 
                                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group"
                                onClick={() => openYearFolder(folder)}
                            >
                                <div className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                                                <FolderOpen className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800 group-hover:text-[#1d4d6a] transition-colors">
                                                    {folder.name}
                                                </h4>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#1d4d6a] transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ========== PAPERS VIEW ========== */
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <button
                                onClick={goBackToYearFolders}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1d4d6a] mb-2"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                                Back to Year Folders
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg">
                                    <FileText className="h-7 w-7 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {selectedYearFolder?.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedSubjectData?.name} • Question Papers & Answer Keys
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Papers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedYearFolder?.papers.map((paper) => (
                            <div 
                                key={paper.id} 
                                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${paper.type === "question" ? "bg-blue-50" : "bg-green-50"}`}>
                                                {paper.type === "question" ? (
                                                    <FileQuestion className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    {paper.title}
                                                </h4>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    Year: {paper.year}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${paper.type === "question" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                            {paper.type === "question" ? "Question Paper" : "Answer Key"}
                                        </span>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleViewPaper(paper)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1d4d6a] text-white rounded-lg text-sm hover:bg-[#163d55] transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PYQSection;