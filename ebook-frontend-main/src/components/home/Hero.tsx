import { Button } from "../ui/button";
import { Carousel } from "./Carousel";

interface HeroProps {
  onNavigate: (page: string) => void;
  onOpenBook?: (book: any) => void;
}

export function Hero({ onNavigate, onOpenBook }: HeroProps) {
  return (
    <section
  className="relative min-h-[80vh] bg-gradient-to-br from-[#1d4d6a] via-[#2a5f7f] to-[#1d4d6a] text-white overflow-hidden flex items-center justify-center px-20"
>
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
  <div className="mt-10 max-w-8xl w-full flex flex-col md:flex-row items-center justify-between">
    {/* LEFT SIDE - TEXT CONTENT */}
    <div className="w-full text-left space-y-6 md:pl-4">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight">
        From Reading to Results — Your Academic Companion
      </h1>
      <p className="text-gray-200 text-lg max-w-md">
        Read smartly, test your knowledge, and explore academic opportunities — all in one place.
      </p>
      <Button
        className="bg-[#bf2026] hover:bg-[#a01c22] text-white px-6 py-3 rounded-lg text-lg transition-all"
        onClick={() => onNavigate("login")}
      >
        Start Reading
      </Button>
    </div>
  </div>

  {/* RIGHT SIDE - CAROUSEL */}
  <div className="w-full md:w-[48%] flex justify-between md:pr-4">
    <div className="w-full">
      <Carousel onNavigate={onNavigate} onOpenBook={onOpenBook} />
    </div>
  </div>
</section>

  );
}