import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, Calendar, Clock, Filter, ChevronDown, Eye, X, ExternalLink } from "lucide-react";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/current-affairs`;

interface CurrentAffairItem {
  id: number;
  title: string;
  category: string;
  description: string;
  tags: string[];
  importance: string;
  views: number;
  date: string;
  time: string;
  image_url: string;
  price: number;
  isPurchased: boolean;
  source?: string;
  relatedTopics?: string[];
}

function CurrentAffairs({ onNavigate }: { onNavigate: (section: string, id?: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [news, setNews] = useState<CurrentAffairItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNews, setSelectedNews] = useState<CurrentAffairItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const modalRef = useRef(null);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

const fetchCategories = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/current-affairs/categories`,
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
    const importanceOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
    return [...news].sort((a, b) => {
      const orderA = importanceOrder[(a.importance || 'low').toLowerCase()] || 4;
      const orderB = importanceOrder[(b.importance || 'low').toLowerCase()] || 4;
      return orderA - orderB;
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

  const handleCardClick = (newsItem: any) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  const buyNow = (item: any) => {
    const token = localStorage.getItem("token");
    if (!token) return onNavigate("login");

    // Normalize the item data for purchase page
    const normalizedItem = {
      ...item,
      cover_url: item.image_url || item.cover_url, // Map image_url to cover_url for consistency
    };

    const purchaseItem = {
      type: "current_affairs",
      id: item.id,
      title: item.title,
      price: item.price,
    };

    localStorage.setItem("purchaseType", "current_affairs");
    localStorage.setItem("purchaseId", String(item.id));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ ...purchaseItem, article: normalizedItem }])
    );
    localStorage.setItem("previousSection", "current-affairs");

    onNavigate("purchase", String(item.id));
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
                {item.price > 0 && (
                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.isPurchased ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.isPurchased ? 'PURCHASED' : `₹${item.price}`}
                  </span>
                )}
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
                  {!item.isPurchased && item.price > 0 ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); buyNow(item); }}
                      className="px-3 py-1 bg-[#bf2026] text-white text-xs font-medium rounded hover:bg-[#2a5d7f] transition-colors"
                    >
                      Buy Now
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Eye className="h-3 w-3" />
                      <span>{item.views?.toLocaleString() || '0'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* News Detail Modal */}
      {isModalOpen && selectedNews && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-white to-[#1d4d6a]/5 border-b border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getCategoryColor(selectedNews.category)}`}>
                    {categories.find(cat => (cat.id || cat._id) === selectedNews.category)?.name || selectedNews.category}
                  </span>
                  {selectedNews.isPurchased && (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      Purchased
                    </span>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-[#bf2026]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-3xl font-bold text-[#1d4d6a]">{selectedNews.title}</h2>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="p-6">
                {/* Date and Time */}
                <div className="flex items-center gap-6 mb-8 text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 text-[#1d4d6a]">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{new Date(selectedNews.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="flex items-center gap-2 text-[#1d4d6a]">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{selectedNews.time}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <div className="flex items-center gap-2 text-[#1d4d6a]">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{selectedNews.views?.toLocaleString() || '0'} views</span>
                  </div>
                </div>

                {/* Full Description */}
                <div className="prose max-w-none mb-8">
                  {selectedNews.isPurchased ? (
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                      {selectedNews.description}
                    </p>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden">
                      <p className="text-gray-600 text-lg leading-relaxed blur-[2px] select-none">
                        {selectedNews.description.slice(0, 200)}...
                      </p>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-md rounded-2xl p-8 text-center">
                        {/* Premium Badge */}
                        <div className="mb-6">
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d4d6a]/10 text-[#1d4d6a] rounded-full text-sm font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-[#bf2026]"></span>
                            Premium Content
                          </span>
                        </div>

                        {/* Icon */}
                        <div className="mb-6 p-4 bg-gradient-to-br from-[#1d4d6a]/20 to-[#bf2026]/10 rounded-full">
                          <Clock className="h-8 w-8 text-[#1d4d6a]" />
                        </div>

                        {/* Heading */}
                        <h4 className="text-2xl font-bold text-[#1d4d6a] mb-3">Unlock Full Analysis</h4>
                        
                        {/* Description */}
                        <p className="text-gray-700 mb-6 max-w-sm leading-relaxed">
                          Get instant access to complete insights, detailed analysis, and expert commentary on this current affairs topic.
                        </p>

                        {/* Price highlight */}
                        <div className="mb-6 p-4 bg-[#bf2026]/10 rounded-xl border border-[#bf2026]/20">
                          <p className="text-sm text-gray-600 mb-1">Get unlimited access for</p>
                          <p className="text-3xl font-bold text-[#bf2026]">₹{selectedNews.price}</p>
                        </div>

                        {/* CTA Button */}
                        <button 
                          onClick={() => buyNow(selectedNews)}
                          className="px-8 py-3.5 bg-gradient-to-r from-[#bf2026] to-[#a01c22] text-white rounded-xl font-bold hover:from-[#a01c22] hover:to-[#8a1618] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Unlock Article Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedNews.tags && selectedNews.tags.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-[#1d4d6a] mb-3 uppercase tracking-wider">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-3 py-1.5 bg-[#1d4d6a]/10 text-[#1d4d6a] text-sm font-medium rounded-lg hover:bg-[#1d4d6a]/20 transition-colors border border-[#1d4d6a]/20"
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
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
              <div className="flex justify-end gap-3">
                {!selectedNews.isPurchased && selectedNews.price > 0 && (
                  <button
                    onClick={() => buyNow(selectedNews)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-[#bf2026] to-[#a01c22] text-white font-bold rounded-lg hover:from-[#a01c22] hover:to-[#8a1618] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Unlock Full Article (₹{selectedNews.price})
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-100 text-[#1d4d6a] font-medium rounded-lg hover:bg-gray-200 transition-colors duration-300 border border-gray-300"
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
          {/* <p className="text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
          </p> */}
        </div>
      )}

      {/* Load More Button */}
      {sortedNews.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchCurrentAffairs()}
            disabled={loading || !hasMore}
            className="px-6 py-3 bg-[#bf2026] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors duration-300 font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : hasMore ? "Load More News" : "No More News"}
          </button>
        </div>
      )}
    </div>
  );
}

export default CurrentAffairs;