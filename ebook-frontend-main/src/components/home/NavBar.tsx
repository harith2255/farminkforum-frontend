import { Button } from "../ui/button";

interface NavbarProps {
  onNavigate: (page: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  return (
<nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#0f3b53] to-[#1d4d6a] shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-15 py-3">

        {/* ---------- Logo ---------- */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => onNavigate("home")}
        >
          <img
            src="/logooutline.png"
            alt="FarmInk Forum Logo"
            className="h-15 w-auto object-contain drop-shadow-lg"
            
          />
        </div>

        {/* ---------- Navigation Links ---------- */}
        <div className="hidden md:flex items-center gap-8">
          {["home", "explore", "pricing", "about", "contact"].map((page) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="text-white hover:text-[#bf2026] font-medium tracking-wide transition"
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}

          <Button
            onClick={() => onNavigate("login")}
            className="bg-[#bf2026] hover:bg-[#a01c22] text-white rounded-xl px-6 py-2 shadow-md transition"
          >
            Sign In
          </Button>
        </div>

        {/* ---------- Mobile Menu Icon (optional) ---------- */}
        <div className="md:hidden">
          <button className="text-[#1d4d6a] text-xl font-bold">☰</button>
        </div>

      </div>
    </nav>
  );
}
