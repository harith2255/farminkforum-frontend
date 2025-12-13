import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus, Upload, X, FileText, CheckCircle, Calendar, AlertCircle, Folder, Eye, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";

function PYQSection() {
  const [folders, setFolders] = useState([
    {
      id: 1,
      name: "Agriculture Extension Education",
      createdAt: new Date("2024-01-15").toISOString(),
      updatedAt: new Date("2024-03-10").toISOString(),
      paperCount: 6,
      papers: [
        {
          id: 101,
          type: "question",
          title: "2020 Question Paper",
          year: "2020",
          fileName: "AgriExt_2020_Question.pdf",
          fileSize: "2.4 MB",
          uploadDate: "2024-01-15",
          status: "published"
        },
        {
          id: 102,
          type: "answer",
          title: "2020 Answer Key",
          year: "2020",
          fileName: "AgriExt_2020_Answer.pdf",
          fileSize: "1.8 MB",
          uploadDate: "2024-01-15",
          status: "published"
        },
        {
          id: 103,
          type: "question",
          title: "2021 Question Paper",
          year: "2021",
          fileName: "AgriExt_2021_Question.pdf",
          fileSize: "2.6 MB",
          uploadDate: "2024-02-20",
          status: "published"
        },
        {
          id: 104,
          type: "answer",
          title: "2021 Answer Key",
          year: "2021",
          fileName: "AgriExt_2021_Answer.pdf",
          fileSize: "2.0 MB",
          uploadDate: "2024-02-20",
          status: "published"
        },
        {
          id: 105,
          type: "question",
          title: "2022 Question Paper",
          year: "2022",
          fileName: "AgriExt_2022_Question.pdf",
          fileSize: "3.1 MB",
          uploadDate: "2024-03-10",
          status: "published"
        },
        {
          id: 106,
          type: "answer",
          title: "2022 Answer Key",
          year: "2022",
          fileName: "AgriExt_2022_Answer.pdf",
          fileSize: "2.2 MB",
          uploadDate: "2024-03-10",
          status: "published"
        }
      ]
    },
    {
      id: 2,
      name: "Education",
      createdAt: new Date("2024-02-01").toISOString(),
      updatedAt: new Date("2024-03-05").toISOString(),
      paperCount: 4,
      papers: [
        {
          id: 201,
          type: "question",
          title: "2023 Question Paper",
          year: "2023",
          fileName: "Education_2023_Question.pdf",
          fileSize: "2.8 MB",
          uploadDate: "2024-02-01",
          status: "published"
        },
        {
          id: 202,
          type: "answer",
          title: "2023 Answer Key",
          year: "2023",
          fileName: "Education_2023_Answer.pdf",
          fileSize: "2.1 MB",
          uploadDate: "2024-02-01",
          status: "published"
        },
        {
          id: 203,
          type: "question",
          title: "2024 Question Paper",
          year: "2024",
          fileName: "Education_2024_Question.pdf",
          fileSize: "3.2 MB",
          uploadDate: "2024-03-05",
          status: "published"
        },
        {
          id: 204,
          type: "answer",
          title: "2024 Answer Key",
          year: "2024",
          fileName: "Education_2024_Answer.pdf",
          fileSize: "2.5 MB",
          uploadDate: "2024-03-05",
          status: "published"
        }
      ]
    }
  ]);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  
  // Upload form states
  const [subjectName, setSubjectName] = useState("");
  const [year, setYear] = useState("");
  const [questionFile, setQuestionFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // View states
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewMode, setViewMode] = useState("folders");
  
  // Track upload mode: "new" for new subject, "add" for adding to existing
  const [uploadMode, setUploadMode] = useState("new");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const handleQuestionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file for question paper");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }
      setQuestionFile(file);
    }
  };

  const handleAnswerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file for answer key");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }
      setAnswerFile(file);
    }
  };

  const handleUpload = async () => {
    // Determine subject name based on mode
    let currentSubjectName = subjectName;
    
    if (uploadMode === "add" && selectedFolder) {
      currentSubjectName = selectedFolder.name;
    }

    if (!currentSubjectName.trim()) {
      alert("Please enter subject name");
      return;
    }

    if (!year) {
      alert("Please select year");
      return;
    }

    if (!questionFile) {
      alert("Please upload question paper");
      return;
    }

    setUploading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create new paper
      const newPaper = {
        id: Date.now() + 1,
        type: "question",
        title: `${year} Question Paper`,
        year: year,
        fileName: questionFile.name,
        fileSize: (questionFile.size / 1024 / 1024).toFixed(2) + " MB",
        uploadDate: new Date().toLocaleDateString(),
        status: "published"
      };

      const papers = [newPaper];
      
      if (answerFile) {
        papers.push({
          id: Date.now() + 2,
          type: "answer",
          title: `${year} Answer Key`,
          year: year,
          fileName: answerFile.name,
          fileSize: (answerFile.size / 1024 / 1024).toFixed(2) + " MB",
          uploadDate: new Date().toLocaleDateString(),
          status: "published"
        });
      }

      // Check if folder for this subject already exists
      const existingFolderIndex = folders.findIndex(f => f.name === currentSubjectName);
      
      if (existingFolderIndex !== -1) {
        // Update existing folder
        const updatedFolders = [...folders];
        updatedFolders[existingFolderIndex] = {
          ...updatedFolders[existingFolderIndex],
          papers: [...updatedFolders[existingFolderIndex].papers, ...papers],
          paperCount: updatedFolders[existingFolderIndex].papers.length + papers.length,
          updatedAt: new Date().toISOString()
        };
        setFolders(updatedFolders);
        
        // Update selected folder if it's the current one
        if (selectedFolder && selectedFolder.name === currentSubjectName) {
          setSelectedFolder(updatedFolders[existingFolderIndex]);
        }
      } else {
        // Create new folder
        const newFolder = {
          id: Date.now(),
          name: currentSubjectName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paperCount: papers.length,
          papers: papers
        };
        
        setFolders(prev => [newFolder, ...prev]);
      }

      // Reset form
      setSubjectName("");
      setYear("");
      setQuestionFile(null);
      setAnswerFile(null);
      setUploadMode("new"); // Reset to default mode
      
      alert("Upload successful!");
      setUploadOpen(false);
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeQuestionFile = () => {
    setQuestionFile(null);
  };

  const removeAnswerFile = () => {
    setAnswerFile(null);
  };

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    setViewMode("papers");
  };

  const goBackToFolders = () => {
    setSelectedFolder(null);
    setViewMode("folders");
  };

  const openUploadModal = (mode = "new") => {
    setUploadMode(mode);
    setUploadOpen(true);
    
    // If adding to existing folder, pre-fill subject name
    if (mode === "add" && selectedFolder) {
      setSubjectName(selectedFolder.name);
    } else {
      setSubjectName("");
    }
    
    // Reset other fields
    setYear("");
    setQuestionFile(null);
    setAnswerFile(null);
  };

  const handleViewPaper = (paper) => {
    alert(`Opening: ${paper.title}\nThis would open the PDF viewer`);
  };

  const handleDownloadPaper = (paper) => {
    alert(`Downloading: ${paper.title}\nThis would download the PDF file`);
  };

  const handleDeletePaper = (paperId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this paper?")) {
      if (selectedFolder) {
        const updatedPapers = selectedFolder.papers.filter(p => p.id !== paperId);
        const updatedFolder = { 
          ...selectedFolder, 
          papers: updatedPapers, 
          paperCount: updatedPapers.length,
          updatedAt: new Date().toISOString()
        };
        
        // Update folders list
        setFolders(prev => prev.map(f => f.id === selectedFolder.id ? updatedFolder : f));
        setSelectedFolder(updatedFolder);
      }
    }
  };

  const handleDeleteFolder = (folderId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this folder and all its papers?")) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      if (selectedFolder && selectedFolder.id === folderId) {
        goBackToFolders();
      }
    }
  };

  // Filter folders based on search
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {viewMode === "folders" ? (
            <h2 className="text-[#1d4d6a] mb-1">
              Previous Year Questions
            </h2>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={goBackToFolders}
                className="text-gray-600 hover:text-[#1d4d6a] flex items-center gap-2"
              >
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Back
              </button>
              <h2 className="text-[#1d4d6a] mb-1">
                {selectedFolder?.name}
              </h2>
            </div>
          )}
          <p className="text-sm text-gray-500">
            {viewMode === "folders" 
              ? `${folders.length} ${folders.length === 1 ? 'subject' : 'subjects'}`
              : `${selectedFolder?.paperCount || 0} papers`
            }
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <Input
            placeholder={viewMode === "folders" ? "Search subject..." : "Search papers..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <Button
            className="bg-[#1d4d6a] text-white"
            onClick={() => openUploadModal("new")}
          >
            <Plus className="w-4 h-4 mr-2" /> Upload
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "folders" ? (
        /* ========== FOLDERS VIEW ========== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFolders.map((folder) => (
            <div 
              key={folder.id} 
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group"
              onClick={() => openFolder(folder)}
            >
              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Folder className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-[#1d4d6a] transition-colors">
                        {folder.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {folder.paperCount} {folder.paperCount === 1 ? 'paper' : 'papers'}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Updated {new Date(folder.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400 group-hover:text-[#1d4d6a] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFolder(folder);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100"
                  >
                    View Papers
                  </button>
                  <button
                    onClick={(e) => handleDeleteFolder(folder.id, e)}
                    className="text-xs text-red-600 hover:text-red-800 px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredFolders.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6">
                <Folder className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No subjects found</h3>
              <p className="text-gray-500 mb-6">
                {search ? 'Try a different search' : 'Upload your first PYQ to get started'}
              </p>
              <Button
                className="bg-[#1d4d6a] text-white"
                onClick={() => openUploadModal("new")}
              >
                <Plus className="w-4 h-4 mr-2" /> Upload First Paper
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ========== PAPERS VIEW ========== */
        selectedFolder && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Folder Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm">
                    <Folder className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedFolder.name}</h3>
                    <p className="text-gray-500">
                      {selectedFolder.paperCount} papers • Created {new Date(selectedFolder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-[#1d4d6a] text-white"
                  onClick={() => openUploadModal("add")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add More Papers
                </Button>
              </div>
            </div>

            {/* Papers List */}
            <div className="divide-y divide-gray-100">
              {selectedFolder.papers.length > 0 ? (
                selectedFolder.papers.map((paper) => (
                  <div key={paper.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${paper.type === "question" ? "bg-blue-50" : "bg-green-50"}`}>
                          {paper.type === "question" ? (
                            <FileText className="h-6 w-6 text-blue-600" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{paper.title}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">Year: {paper.year}</span>
                            <span className="text-sm text-gray-500">{paper.fileSize}</span>
                            <span className="text-sm text-gray-500">Uploaded: {paper.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${paper.type === "question" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {paper.type === "question" ? "Question Paper" : "Answer Key"}
                        </span>
                        <button
                          onClick={() => handleViewPaper(paper)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPaper(paper)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePaper(paper.id, e)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No papers yet</h3>
                  <p className="text-gray-500 mb-6">Upload question papers for this subject</p>
                  <Button
                    className="bg-[#1d4d6a] text-white"
                    onClick={() => openUploadModal("add")}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Upload Papers
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="text-[#1d4d6a] text-lg sm:text-xl">
              {uploadMode === "add" ? "Add Papers to Folder" : "Upload Previous Year Question"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {uploadMode === "add" 
                ? `Add question papers to "${selectedFolder?.name}"`
                : "Add a new subject with question paper and answer key"
              }
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-4">
            <div className="space-y-5">
              {/* Subject Name - Only show for new upload, not for add mode */}
              {uploadMode === "new" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Subject Name
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Agriculture Extension Education"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Year Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Year
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">Select Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Paper Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Question Paper (PDF)
                  <span className="text-red-500">*</span>
                </label>
                {!questionFile ? (
                  <div className="relative">
                    <input
                      type="file"
                      id="question-upload"
                      accept=".pdf"
                      onChange={handleQuestionFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="question-upload"
                      className="flex flex-col sm:flex-row items-center justify-center gap-3 p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1d4d6a] hover:bg-blue-50 cursor-pointer transition-colors w-full"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <Upload className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-medium text-gray-700">
                          Upload Question Paper
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click to browse or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Max file size: 10MB</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{questionFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(questionFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeQuestionFile}
                      className="p-2 hover:bg-blue-100 rounded-lg self-end sm:self-center"
                      title="Remove file"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Answer Key Upload (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Answer Key (PDF) - Optional
                  </label>
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    Optional
                  </span>
                </div>
                {!answerFile ? (
                  <div className="relative">
                    <input
                      type="file"
                      id="answer-upload"
                      accept=".pdf"
                      onChange={handleAnswerFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="answer-upload"
                      className="flex flex-col sm:flex-row items-center justify-center gap-3 p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#1d4d6a] hover:bg-green-50 cursor-pointer transition-colors w-full"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-medium text-gray-700">
                          Upload Answer Key
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Optional but recommended
                        </p>
                        <p className="text-xs text-gray-500">Max file size: 10MB</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{answerFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(answerFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeAnswerFile}
                      className="p-2 hover:bg-green-100 rounded-lg self-end sm:self-center"
                      title="Remove file"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Requirements Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Upload Requirements
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                        <span>Only PDF files are accepted</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                        <span>Maximum file size: 10MB per file</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                        <span>Question paper is required</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                        <span>Answer key is optional but recommended for better user experience</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer - Equal Width Buttons */}
          <DialogFooter className="px-6 py-4 border-t bg-white sticky bottom-0">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadOpen(false);
                  setUploadMode("new"); // Reset mode
                }}
                disabled={uploading}
                className="flex-1 sm:flex-1 w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !year || !questionFile || (uploadMode === "new" && !subjectName)}
                className="bg-[#1d4d6a] text-white hover:bg-[#16384e] flex-1 sm:flex-1 w-full"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>{uploadMode === "add" ? "Add Papers" : "Upload Papers"}</span>
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PYQSection;