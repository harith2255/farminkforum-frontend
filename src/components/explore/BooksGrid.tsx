import { Card } from "../ui/card";
import BookCard from "./BooksCard";

const BooksGrid = ({
  books,
  onNavigate,
  isLoggedIn,
}: {
  books: any[];
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onNavigate={onNavigate}
          isLoggedIn={isLoggedIn}   // ✔️ IMPORTANT
        />
      ))}
    </div>
  );
};

export default BooksGrid;
