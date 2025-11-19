import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "./HeroSection";
import CategoryFilter from "./CategorySection";
//import StatsBar from "./StatusBar";
import BooksGrid from "./BooksGrid";

function ExplorePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "All",
    "Agricultural Extension Education",
    "Adult and Continuing Education and Extension"
  ];

  const books = [
    { id: 1, title: "Agricultural Extension Education", author: "Dr. Sarah Smith", category: "Agricultural Extension Education", price: 24.99, rating: 4.8, reviews: 342, cover: "", bestseller: true },
    { id: 2, title: "Adult and Continuing Education and Extension", author: "Prof. Michael Johnson", category: "Adult and Continuing Education and Extension", price: 29.99, rating: 4.9, reviews: 523, cover: "", trending: true },
   
  ];

  const filteredBooks = books.filter(
    (book) =>
      (selectedCategory === "All" || book.category === selectedCategory) &&
      (searchQuery === "" ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        {/* <StatsBar totalBooks={filteredBooks.length} /> */}
        <BooksGrid books={filteredBooks} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export default ExplorePage;
