import React, { useState, useEffect } from "react";
import { Plus, Search, ChevronRight, X, Calendar, Tag, Globe, Clock, Edit, Trash2, Eye } from "lucide-react";

function CurrentAffairsAdmin() {
  const [viewMode, setViewMode] = useState("folders");
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  
  const [formData, setFormData] = useState({
    id: Date.now(),
    title: "",
    category: "",
    content: "",
    tags: "",
    importance: "medium",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    image: null,
    status: "published",
    createdAt: new Date().toISOString()
  });

  // Load articles from localStorage on component mount
  useEffect(() => {
    const savedArticles = localStorage.getItem("currentAffairsArticles");
    if (savedArticles) {
      try {
        const parsedArticles = JSON.parse(savedArticles);
        setArticles(parsedArticles);
      } catch (error) {
        console.error("Error loading articles from localStorage:", error);
        setArticles([]);
      }
    }
  }, []);

  // Save articles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("currentAffairsArticles", JSON.stringify(articles));
  }, [articles]);

  const [folders] = useState([
    { id: 1, name: "National Affairs" },
    { id: 2, name: "International News" },
    { id: 3, name: "Economy" },
    { id: 4, name: "Science & Tech" },
    { id: 5, name: "Environment" },
    { id: 6, name: "Sports" },
  ]);

  const categories = [
    "National Affairs",
    "International News",
    "Economy",
    "Science & Tech",
    "Environment",
    "Sports",
    "Politics",
    "Health",
    "Education",
    "Technology"
  ];

  const goBackToFolders = () => {
    setViewMode("folders");
    setSelectedFolder(null);
  };

  const selectFolder = (folder) => {
    setSelectedFolder(folder);
    setViewMode("articles");
  };

  const handleOpenAddModal = () => {
    setEditingArticle(null);
    setFormData({
      id: Date.now(),
      title: "",
      category: viewMode === "articles" ? selectedFolder?.name || "" : "",
      content: "",
      tags: "",
      importance: "medium",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      image: null,
      status: "published",
      createdAt: new Date().toISOString()
    });
    setShowAddModal(true);
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article.id);
    setFormData({
      ...article,
      image: null
    });
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files.length > 0) {
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingArticle) {
      // Update existing article
      setArticles(prev => prev.map(article => 
        article.id === editingArticle ? formData : article
      ));
      alert("Article updated successfully!");
    } else {
      // Add new article
      const newArticle = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setArticles(prev => [...prev, newArticle]);
      alert("Article added successfully!");
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: Date.now(),
      title: "",
      category: "",
      content: "",
      tags: "",
      importance: "medium",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      image: null,
      status: "published",
      createdAt: new Date().toISOString()
    });
    setEditingArticle(null);
  };

  const handleDeleteArticle = (id) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      setArticles(prev => prev.filter(article => article.id !== id));
      alert("Article deleted successfully!");
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArticles = articles.filter(article => 
    selectedFolder ? article.category === selectedFolder.name : true
  );

  const getStatusColor = (status) => {
    switch(status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getImportanceColor = (importance) => {
    switch(importance) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {viewMode === "folders" ? (
            <>
              <h2 className="text-[#1d4d6a] mb-1">
                Current Affairs Admin
              </h2>
              <p className="text-sm text-gray-500">
                {articles.length} articles stored locally
              </p>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={goBackToFolders}
                className="text-gray-600 hover:text-[#1d4d6a] flex items-center gap-2 text-sm"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Categories
              </button>
              <div>
                <h2 className="text-[#1d4d6a] text-xl font-bold mb-1">
                  {selectedFolder?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredArticles.length} articles in this category
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={viewMode === "folders" ? "Search categories..." : "Search articles..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm w-full sm:w-64"
            />
          </div>

          {/* Add New Button */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[400px]">
        {viewMode === "folders" ? (
          <>
            {filteredFolders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No categories found</p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-sm text-[#1d4d6a] hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map(folder => {
                  const articleCount = articles.filter(a => a.category === folder.name).length;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => selectFolder(folder)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#1d4d6a] hover:bg-gray-50 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800 group-hover:text-[#1d4d6a]">
                            {folder.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1d4d6a]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Articles in {selectedFolder?.name}</h3>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Article
              </button>
            </div>
            
            {/* Articles Table */}
            <div className="border rounded-lg overflow-hidden">
              {filteredArticles.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No articles in this category yet</p>
                  <p className="text-sm mt-1">Click "Add Article" to create your first article</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Title</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Importance</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredArticles.map(article => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{article.title}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {article.content.substring(0, 60)}...
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(article.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(article.importance)}`}>
                            {article.importance}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => console.log("View article", article.id)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="View"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleEditArticle(article)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-[#1d4d6a]">
                  {editingArticle ? "Edit Article" : "Add New Current Affairs Article"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingArticle ? "Update the article details" : "Fill in the details to create a new article"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Article Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter article title"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent appearance-none cursor-pointer"
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Enter tags separated by commas (e.g., politics, economy, news)"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Importance Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importance Level
                    </label>
                    <div className="flex gap-3">
                      {["low", "medium", "high"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, importance: level }))}
                          className={`flex-1 py-2.5 text-center rounded-lg border transition-all ${formData.importance === level
                              ? level === "high"
                                ? "bg-red-100 border-red-300 text-red-700"
                                : level === "medium"
                                ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                                : "bg-green-100 border-green-300 text-green-700"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent appearance-none cursor-pointer"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column - Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    placeholder="Write your article content here..."
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors"
                >
                  {editingArticle ? "Update Article" : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrentAffairsAdmin;