import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users, Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";


interface CarouselProps {
  onNavigate: (page: string) => void;


}

export function Carousel({ onNavigate}: CarouselProps) {
  const featuredBooks = [
  {
    id: 1,
    title: "Agricultural Extension and Communication Management",
    author: "Dr. S.V. Patel",
    category: "Agricultural Extension Education",
    cover:
      "https://m.media-amazon.com/images/I/71V4D1R9LxL._SY425_.jpg",
    rating: 4.8,
    readers: 12400,
  },
  {
    id: 2,
    title: "Fundamentals of Agricultural Extension Education",
    author: "Dr. R. Saravanan",
    category: "Agricultural Extension Education",
    cover:
      "https://m.media-amazon.com/images/I/71UxLgP5SLL._SY425_.jpg",
    rating: 4.7,
    readers: 15600,
  },
  {
    id: 3,
    title: "Adult and Continuing Education: Principles and Practices",
    author: "Dr. B. S. Bhatia",
    category: "Adult and Continuing Education",
    cover:
      "https://m.media-amazon.com/images/I/61Vn2JwPiHL._SY425_.jpg",
    rating: 4.6,
    readers: 9800,
  },
  {
    id: 4,
    title: "Extension Education and Rural Development",
    author: "Dr. A. K. Singh",
    category: "Extension Education",
    cover:
      "https://m.media-amazon.com/images/I/71VwJbJHPrL._SY425_.jpg",
    rating: 4.9,
    readers: 17200,
  },
  {
    id: 5,
    title: "Methods and Techniques of Teaching in Extension",
    author: "Dr. N. P. Singh",
    category: "Agricultural Extension",
    cover:
      "https://m.media-amazon.com/images/I/71Kgn9N9ZRL._SY425_.jpg",
    rating: 4.7,
    readers: 10200,
  },
  {
    id: 6,
    title: "Adult Learning and Extension Strategies",
    author: "Dr. R. K. Sharma",
    category: "Adult and Continuing Education",
    cover:
      "https://m.media-amazon.com/images/I/71nZ2sHEkDL._SY425_.jpg",
    rating: 4.8,
    readers: 11300,
  },
];


  const [current, setCurrent] = useState(0);

  const handleNext = () =>
    setCurrent((prev) => (prev + 1) % featuredBooks.length);
  const handlePrev = () =>
    setCurrent((prev) => (prev - 1 + featuredBooks.length) % featuredBooks.length);

    const handleReadNow = () => {
      onNavigate("login"); // redirect to /login route
    };

  useEffect(() => {
    const interval = setInterval(() => handleNext(), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[700px] h-[320px] flex items-center justify-center mx-auto">
      {featuredBooks.map((book, index) => {
        const offset = (index - current + featuredBooks.length) % featuredBooks.length;

        // Calculate positioning for 3D effect
        let transform = "";
        let zIndex = 0;
        let opacity = 1;
        let scale = 1;

        if (offset === 0) {
          // Center Book
          transform = "translateX(0) scale(1)";
          zIndex = 3;
          scale = 1.05;
        } else if (offset === 1 || offset === -3) {
          // Right-side book
          transform = "translateX(200px) scale(0.9)";
          zIndex = 2;
          opacity = 0.7;
        } else if (offset === 3 || offset === -1) {
          // Left-side book
          transform = "translateX(-200px) scale(0.9)";
          zIndex = 2;
          opacity = 0.7;
        } else {
          // Back book (hidden)
          transform = "translateX(0) scale(0.8)";
          zIndex = 1;
          opacity = 0;
        }

        return (
          <div
            key={book.id}
            className="absolute transition-all duration-700 ease-out cursor-pointer"
            style={{
              transform,
              zIndex,
              opacity,
            }}
            onClick={handleReadNow}
          >
            <Card className="w-56 h-[350x] overflow-hidden bg-white backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl">
              <div className="h-40 overflow-hidden rounded-t-lg">
  <ImageWithFallback
    src={book.cover}
    alt={book.title}
    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
  />
</div>

              <CardContent className="p-4 bg-white/90 text-gray-900">
                <h3 className="font-semibold text-lg line-clamp-1 -mt-8">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                  {book.author} • {book.category}
                </p>
                <div className="flex justify-between items-center text-sm mb-3">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    {book.rating}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    {book.readers.toLocaleString()}
                  </div>
                </div>
                <Button onClick= {handleReadNow} className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white transition-all">
                  Read Now
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {/* <button
        onClick={handlePrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center transition-all"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button> */}
    </div>
  );
}
