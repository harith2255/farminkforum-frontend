import { Search } from "lucide-react";

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const HeroSection: React.FC<HeroProps> = ({ searchQuery, setSearchQuery }) => {
  return (
<section className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] text-white py-12 sm:py-16 md:py-20 overflow-hidden">

  {/* Dotted radial background */}
  <div className="absolute inset-0 opacity-10 pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "50px 50px",
      }}
    />
  </div>

  {/* Your existing content (unchanged) */}
  <div className="mt-8 sm:mt-15 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
    <div className="max-w-3xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Curated Study Materials</h1>

      <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8">
        Access high-quality agriculture-focused study materials designed for competitive exam preparation.
      </p>

      <div className="relative max-w-2xl">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search materials..."
          className="w-full pl-11 pr-4 py-3 sm:py-4 rounded-xl text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[#bf2026] focus:border-transparent outline-none transition-all text-sm sm:text-base shadow-lg"
        />
      </div>
    </div>
  </div>

</section>

  );
};

export default HeroSection;
