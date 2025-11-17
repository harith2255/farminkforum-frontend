import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Award, TrendingUp, Star } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type BookCardProps = {
  book: any;
  onNavigate: (route: string) => void;
  isLoggedIn: boolean;
};

const BookCard = ({ book, onNavigate, isLoggedIn }: BookCardProps) => {
  const handleBuyNow = () => {
    if (!isLoggedIn) {
      onNavigate("login");
    } else {
      onNavigate("buynowpage");
    }
  };

  const handleViewDetails = () => {
    onNavigate("login");
  };

  const handleAddToCart = () => {
    onNavigate("login");
  };

  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden">
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <ImageWithFallback
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Bestseller Badge */}
        {book.bestseller && (
          <Badge className="absolute top-3 left-3 bg-[#bf2026] text-white flex items-center">
            <Award className="w-3 h-3 mr-1" />
            Bestseller
          </Badge>
        )}

        {/* Trending Badge */}
        {book.trending && (
          <Badge className="absolute top-3 right-3 bg-green-600 text-white flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Button
            onClick={handleViewDetails}
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
          >
            View Details
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="p-4">
        <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">
          {book.category}
        </Badge>

        <h3 className="text-[#1d4d6a] mb-1 line-clamp-1">{book.title}</h3>
        <p className="text-sm text-gray-500 mb-3">{book.author}</p>

        {/* Rating + Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm">{book.rating}</span>
            <span className="text-xs text-gray-500">({book.reviews})</span>
          </div>
          <span className="text-[#bf2026] font-semibold">₹{book.price}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
            size="sm"
          >
            Add to Cart
          </Button>

          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
            size="sm"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
