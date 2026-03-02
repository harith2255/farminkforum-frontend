import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, ChevronRight, X, Calendar, Tag, Globe, Clock, Edit, Trash2, Eye, Folder, FolderOpen } from "lucide-react";

const BASE_URL = "https://e-book-backend-production.up.railway.app/api/admin/current-affairs";

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
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    image: null,
    createdAt: new Date().toISOString()
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error("Failed to load articles");

      const data = await res.json();

      const formatted = data.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        content: a.content,
        tags: a.tags || "",
        status: a.status,
        date: a.article_date,
        time: a.article_time,
        imageUrl: a.image_url,
        createdAt: a.created_at,
      }));

      setArticles(formatted);
    } catch (err) {
      console.error(err);
      alert("Unable to load articles");
    }
  };

  const folders = useMemo(() => {
    const categories = new Set();
    articles.forEach(article => {
      if (article.category && article.category.trim()) {
        categories.add(article.category.trim());
      }
    });
    
    return Array.from(categories).map((category, index) => ({
      id: index + 1,
      name: category
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [articles]);

  const getArticleCountForCategory = (categoryName) => {
    return articles.filter(article => article.category === categoryName).length;
  };

  const goBackToFolders = () => {
    setViewMode("folders");
    setSelectedFolder(null);
    setSearch("");
  };

  const selectFolder = (folder) => {
    setSelectedFolder(folder);
    setViewMode("articles");
    setSearch("");
  };

  const handleOpenAddModal = () => {
    setEditingArticle(null);
    setFormData({
      id: Date.now(),
      title: "",
      category: selectedFolder?.name || "",
      content: "",
      tags: "",
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
      image: null,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();

      form.append("title", formData.title);
      form.append("category", formData.category.trim());
      form.append("content", formData.content);
      form.append("tags", formData.tags);
      form.append("status", formData.status);
      form.append("date", formData.date);
      form.append("time", formData.time);

      if (formData.image) {
        form.append("image", formData.image);
      }

      const url = editingArticle
        ? `${BASE_URL}/${editingArticle}`
        : BASE_URL;

      const method = editingArticle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: form,
      });

      if (!res.ok) throw new Error("Save failed");

      alert(editingArticle ? "Article updated successfully!" : "Article added successfully!");

      setShowAddModal(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(err);
      alert("Failed to save article");
    }
  };

  const resetForm = () => {
    setFormData({
      id: Date.now(),
      title: "",
      category: "",
      content: "",
      tags: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      image: null,
      status: "published",
      createdAt: new Date().toISOString()
    });
    setEditingArticle(null);
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      alert("Article deleted successfully!");
      fetchArticles();
    } catch (err) {
      console.error(err);
      alert("Failed to delete article");
    }
  };

  const handleDeleteFolder = async (folderName) => {
    if (!window.confirm(
      `This will permanently delete all articles in "${folderName}". Continue?`
    )) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${BASE_URL}/category/${encodeURIComponent(folderName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      alert(`Category "${folderName}" deleted successfully`);
      fetchArticles();
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArticles = viewMode === "articles" && selectedFolder
    ? articles.filter(article => article.category === selectedFolder.name)
    : [];

  const getStatusColor = (status) => {
    switch(status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          {viewMode === "folders" ? (
            <>
              <h2 className="text-[#1d4d6a] text-lg sm:text-xl font-bold mb-1">
                Current Affairs Admin
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {folders.length} categories, {articles.length} total articles
              </p>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <button
                onClick={goBackToFolders}
                className="text-gray-600 hover:text-[#1d4d6a] flex items-center gap-2 text-sm self-start"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Categories
              </button>
              <div>
                <h2 className="text-[#1d4d6a] text-lg sm:text-xl font-bold mb-1">
                  {selectedFolder?.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {filteredArticles.length} articles in this category
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={viewMode === "folders" ? "Search categories..." : "Search articles..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm w-full"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {viewMode === "folders" ? "Add New Article" : "Add to this Category"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {viewMode === "folders" ? (
          <>
            {folders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Folder className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No categories found</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Create your first article to automatically create a category</p>
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors flex items-center gap-2 mx-auto text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create First Article
                </button>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No categories match your search</p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-sm text-[#1d4d6a] hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredFolders.map(folder => {
                  const articleCount = getArticleCountForCategory(folder.name);
                  return (
                    <div
                      key={folder.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-[#1d4d6a] hover:bg-gray-50 transition-all group cursor-pointer"
                      onClick={() => selectFolder(folder)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-5 h-5 text-gray-400 group-hover:text-[#1d4d6a] flex-shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-800 group-hover:text-[#1d4d6a] truncate">
                              {folder.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectFolder(folder);
                            }}
                            className="p-1 sm:p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-[#1d4d6a]"
                            title="Open Folder"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.name);
                            }}
                            className="p-1 sm:p-1.5 hover:bg-red-50 rounded text-gray-600 hover:text-red-600"
                            title="Delete Folder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                <h3 className="text-base sm:text-lg font-semibold truncate">
                  Articles in "{selectedFolder?.name}"
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setSelectedFolder(null);
                    handleOpenAddModal();
                  }}
                  className="px-3 sm:px-4 py-2 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Article
                </button>
                {/* <button
                  onClick={goBackToFolders}
                  className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Back to Categories
                </button> */}
              </div>
            </div>
            
            {/* Articles Table - Responsive */}
<div className="border rounded-lg overflow-hidden">
  {filteredArticles.length === 0 ? (
    <div className="py-8 text-center text-gray-500 px-4">
      <p>No articles in this category yet</p>
      <p className="text-xs sm:text-sm mt-1">
        Click "Add Article" to create your first article in this category
      </p>
    </div>
  ) : (
    <>
      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Title</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredArticles.map(article => (
              <tr key={article.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900 truncate max-w-xs">
                    {article.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                    {article.content.substring(0, 60)}...
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(article.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      article.status
                    )}`}
                  >
                    {article.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditArticle(article)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
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
      </div>

      {/* Mobile Card View (shown only on mobile) */}
      <div className="sm:hidden divide-y divide-gray-200">
        {filteredArticles.map(article => (
          <div
            key={article.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-base truncate">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(article.date).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      article.status
                    )}`}
                  >
                    {article.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleEditArticle(article)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="p-1.5 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {article.content.substring(0, 120)}
              {article.content.length > 120 ? "..." : ""}
            </p>
          </div>
        ))}
      </div>
    </>
  )}
</div>
          </div>
        )}
      </div>

      {/* Add/Edit Article Modal - Responsive */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="pr-4">
                <h3 className="text-lg sm:text-xl font-semibold text-[#1d4d6a]">
                  {editingArticle ? "Edit Article" : "Add New Current Affairs Article"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {editingArticle ? "Update the article details" : "Fill in the details to create a new article"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm sm:text-base"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="relative">
                      <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        placeholder="Type a category name (will create a folder)"
                        className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This will create or add to a folder named "{formData.category || 'your category'}"
                    </p>
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
                        placeholder="Enter tags separated by commas"
                        className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                          className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm sm:text-base"
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
                          className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
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
                    rows={12}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent resize-none text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2.5 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors text-sm sm:text-base order-1 sm:order-2"
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