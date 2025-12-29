import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, Calendar, Clock, Filter, ChevronDown, Eye, X, ExternalLink } from "lucide-react";

const BASE_URL = "https://ebook-backend-lxce.onrender.com/api/current-affairs";

function CurrentAffairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const modalRef = useRef(null);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

const fetchCategories = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      "https://ebook-backend-lxce.onrender.com/api/current-affairs/categories",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 401) {
      console.warn("Unauthorized categories request");
      setCategories([]);
      return;
    }

    if (!res.ok) throw new Error("Failed to load categories");

    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Category fetch failed:", err);
    setCategories([]);
  }
};

  const fetchCurrentAffairs = async (reset = false) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in");
        return;
      }

      const res = await fetch(
        `${BASE_URL}?page=${reset ? 1 : page}&limit=9&category=${selectedCategory}&search=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load news");

      const result = await res.json();

      if (reset) {
        setNews(result.data);
      } else {
        setNews(prev => [...prev, ...result.data]);
      }

      setHasMore(result.data.length === 9);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setError("Unable to load current affairs");
    } finally {
      setLoading(false);
    }
  };

  // Initial load with categories
  useEffect(() => {
    fetchCategories();
    fetchCurrentAffairs(true);
  }, []);

  // Category change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchCurrentAffairs(true);
  }, [selectedCategory]);

  // Search with debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchCurrentAffairs(true);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Sort news by importance: high first, then medium, then low
  const sortedNews = useMemo(() => {
    return [...news].sort((a, b) => {
      const importanceOrder = { high: 1, medium: 2, low: 3 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    });
  }, [news]);

  const getCategoryColor = (category) => {
    switch(category) {
      case 'national': return 'bg-blue-100 text-blue-800';
      case 'international': return 'bg-purple-100 text-purple-800';
      case 'economy': return 'bg-green-100 text-green-800';
      case 'science': return 'bg-indigo-100 text-indigo-800';
      case 'sports': return 'bg-orange-100 text-orange-800';
      case 'environment': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = (newsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    
    if (isModalOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  return (
    <div className="space-y-6 p-4 sm:p-0 relative">
      {/* Header Row with Heading and Search/Filter */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Left: Heading and Tagline */}
        <div className="lg:max-w-[50%]">
          <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">
            Current Affairs
          </h2>
          <p className="text-sm text-gray-500">Today's News, Tomorrow's Success.</p>
        </div>

        {/* Right: Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Category Filter */}
          <div className="flex-1 sm:flex-none">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm appearance-none cursor-pointer"
              >
                {/* <option value="all">All Categories</option> */}
              {Array.isArray(categories) &&
  categories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 lg:flex-none lg:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search News and Events..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent text-sm"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Affairs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNews.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
            onClick={() => handleCardClick(item)}
          >
            {/* Card Header */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                  {categories.find(cat => (cat.id || cat._id) === item.category)?.name || item.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags && item.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Footer with metadata */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{item.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Eye className="h-3 w-3" />
                    <span>{item.views?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* News Detail Modal */}
      {isModalOpen && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-300"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedNews.category)}`}>
                    {categories.find(cat => (cat.id || cat._id) === selectedNews.category)?.name || selectedNews.category}
                  </span>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedNews.title}</h2>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="p-6">
                {/* Date and Time */}
                <div className="flex items-center gap-6 mb-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedNews.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{selectedNews.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{selectedNews.views?.toLocaleString() || '0'} views</span>
                  </div>
                </div>

                {/* Full Description */}
                <div className="prose max-w-none mb-8">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                    {selectedNews.fullDescription || selectedNews.description}
                  </p>
                </div>

                {/* Tags */}
                {selectedNews.tags && selectedNews.tags.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Details if available */}
                {selectedNews.source && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Source</h4>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                      <a 
                        href={selectedNews.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                      >
                        {selectedNews.source}
                      </a>
                    </div>
                  </div>
                )}

                {selectedNews.relatedTopics && selectedNews.relatedTopics.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Related Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.relatedTopics.map((topic, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {sortedNews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {sortedNews.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchCurrentAffairs()}
            disabled={loading || !hasMore}
            className="px-6 py-3 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors duration-300 font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : hasMore ? "Load More News" : "No More News"}
          </button>
        </div>
      )}
    </div>
  );
}

export default CurrentAffairs;