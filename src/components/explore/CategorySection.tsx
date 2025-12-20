import * as React from "react";
import { Button } from "../ui/button";
import { Filter } from "lucide-react";

interface Props {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  showHeading?: boolean;
  layout?: "default" | "user";
}

const CategoryFilter: React.FC<Props> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  showHeading = true,
  layout = "default",
}) => {
  // ✅ remove empty / duplicate categories
  const safeCategories = React.useMemo(
    () => Array.from(new Set(categories.filter(Boolean))),
    [categories]
  );

  return (
    <div className="mb-8">
      {/* HEADER */}
      {showHeading && layout === "default" && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#1d4d6a] text-lg font-semibold">
            Browse by Category
          </h2>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      )}

      {/* CATEGORY BUTTONS */}
      <div className="flex gap-3 flex-wrap">
        {safeCategories.map((cat) => (
          <button
            key={`cat-${cat}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === cat
                ? "bg-[#bf2026] text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:border-[#bf2026] hover:text-[#bf2026]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* USER LAYOUT EXTRA FILTERS */}
      {layout === "user" && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
          <Button
            className="bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
            onClick={() =>
              alert("Recommended books feature coming soon!")
            }
          >
            Recommended
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;