import React, { useEffect, useState, useMemo } from "react";
import { Search, Calendar, Clock, Filter, ChevronDown, Eye } from "lucide-react";

const BASE_URL = "https://ebook-backend-lxce.onrender.com/api/current-affairs";

function CurrentAffairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "national", name: "National" },
    { id: "international", name: "International" },
    { id: "economy", name: "Economy" },
    { id: "science", name: "Science & Tech" },
    { id: "sports", name: "Sports" },
    { id: "environment", name: "Environment" },
  ];

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

  useEffect(() => {
    fetchCurrentAffairs(true);
  }, []);

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

  return (
    <div className="space-y-6 p-4 sm:p-0">
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
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
          >
            {/* Card Header */}
            <div className="p-5">
              <div className="mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                  {categories.find(cat => cat.id === item.category)?.name}
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
                {item.tags.map(tag => (
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
                    <button className="flex items-center gap-1 text-gray-500 text-xs">
                      <Eye className="h-3 w-3" />
                      <span>{item.views.toLocaleString()}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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