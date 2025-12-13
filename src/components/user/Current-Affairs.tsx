import React, { useState } from "react";
import { Search, Calendar, Clock, Filter, ChevronDown, Bookmark, Share2, Eye } from "lucide-react";

function CurrentAffairs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarkedItems, setBookmarkedItems] = useState([]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleBookmark = (id) => {
    if (bookmarkedItems.includes(id)) {
      setBookmarkedItems(bookmarkedItems.filter(item => item !== id));
    } else {
      setBookmarkedItems([...bookmarkedItems, id]);
    }
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

  const dummyCurrentAffairs = [
    {
      id: 1,
      title: "India Launches New Space Mission to Study Black Holes",
      date: "2024-01-15",
      time: "10:30 AM",
      category: "science",
      description: "ISRO successfully launches XPoSat mission to study cosmic X-rays and black holes, marking a significant milestone in space research.",
      tags: ["Space", "ISRO", "Research", "Science"],
      views: 1245,
      importance: "high"
    },
    {
      id: 2,
      title: "Global Climate Summit Concludes with New Emission Targets",
      date: "2024-01-14",
      time: "03:45 PM",
      category: "environment",
      description: "World leaders agree on ambitious carbon reduction goals at the annual climate conference in Dubai.",
      tags: ["Climate", "Environment", "Global Summit"],
      views: 892,
      importance: "high"
    },
    {
      id: 3,
      title: "New Economic Policy Announced to Boost Manufacturing",
      date: "2024-01-13",
      time: "11:00 AM",
      category: "economy",
      description: "Government unveils 'Make in India 2.0' with incentives for electronics and semiconductor manufacturing.",
      tags: ["Economy", "Manufacturing", "Policy"],
      views: 1567,
      importance: "medium"
    },
    {
      id: 4,
      title: "Historic Peace Agreement Signed Between Neighboring Countries",
      date: "2024-01-12",
      time: "02:15 PM",
      category: "international",
      description: "After decades of conflict, two nations reach a comprehensive peace agreement mediated by UN.",
      tags: ["Diplomacy", "Peace", "International Relations"],
      views: 2103,
      importance: "high"
    },
    {
      id: 5,
      title: "National Education Policy Implementation Gains Momentum",
      date: "2024-01-11",
      time: "09:30 AM",
      category: "national",
      description: "States report progress in implementing the new education policy focusing on skill development.",
      tags: ["Education", "Policy", "Development"],
      views: 987,
      importance: "medium"
    },
    {
      id: 6,
      title: "AI Breakthrough in Medical Diagnostics Announced",
      date: "2024-01-10",
      time: "04:20 PM",
      category: "science",
      description: "Researchers develop AI model that can detect early-stage diseases with 98% accuracy.",
      tags: ["AI", "Healthcare", "Technology"],
      views: 1789,
      importance: "high"
    },
    {
      id: 7,
      title: "Asian Games 2023: India's Medal Tally Reaches Record High",
      date: "2024-01-09",
      time: "01:10 PM",
      category: "sports",
      description: "Indian athletes secure historic medal count in various disciplines at the Asian Games.",
      tags: ["Sports", "Achievement", "Asian Games"],
      views: 1342,
      importance: "medium"
    },
    {
      id: 8,
      title: "New Archaeological Discovery Rewrites Ancient History",
      date: "2024-01-08",
      time: "10:00 AM",
      category: "national",
      description: "Excavation site reveals evidence of advanced civilization dating back 5000 years.",
      tags: ["Archaeology", "History", "Discovery"],
      views: 765,
      importance: "low"
    },
  ];

  const filteredData = dummyCurrentAffairs.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getImportanceColor = (importance) => {
    switch(importance) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total News</p>
          <p className="text-2xl font-bold text-[#1d4d6a]">{dummyCurrentAffairs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">High Importance</p>
          <p className="text-2xl font-bold text-red-600">
            {dummyCurrentAffairs.filter(item => item.importance === 'high').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Bookmarked</p>
          <p className="text-2xl font-bold text-yellow-600">{bookmarkedItems.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Showing</p>
          <p className="text-2xl font-bold text-green-600">{filteredData.length}</p>
        </div>
      </div>

      {/* Current Affairs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                  {categories.find(cat => cat.id === item.category)?.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBookmark(item.id)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${bookmarkedItems.includes(item.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                  >
                    <Bookmark className="h-4 w-4" fill={bookmarkedItems.includes(item.id) ? "currentColor" : "none"} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">{item.title}</h3>

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
                    <Eye className="h-3 w-3" />
                    <span>{item.views.toLocaleString()}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getImportanceColor(item.importance)}`}>
                    {item.importance.charAt(0).toUpperCase() + item.importance.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredData.length === 0 && (
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

      {/* Load More Button (dummy functionality) */}
      {filteredData.length > 0 && (
        <div className="flex justify-center pt-4">
          <button className="px-6 py-3 bg-[#1d4d6a] text-white rounded-lg hover:bg-[#2a5d7f] transition-colors duration-300 font-medium">
            Load More News
          </button>
        </div>
      )}
    </div>
  );
}

export default CurrentAffairs;