import { Search } from "lucide-react";

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const HeroSection: React.FC<HeroProps> = ({ searchQuery, setSearchQuery }) => {
  return (
<section className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] text-white py-20 overflow-hidden">

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
  <div className="mt-15 max-w-7xl mx-auto px-6 relative z-10">
    <div className="max-w-3xl">
      <h1 className="text-5xl mb-6">Explore Our Vast Digital Library</h1>

      <p className="text-xl text-gray-200 mb-8">
        Discover over 10,000 academic e-books across all disciplines. Your
        next breakthrough starts here.
      </p>

      <div className="relative max-w-2xl">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, author, or subject..."
          className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 bg-white border border-gray-300"
        />
      </div>
    </div>
  </div>

</section>

  );
};

export default HeroSection;
