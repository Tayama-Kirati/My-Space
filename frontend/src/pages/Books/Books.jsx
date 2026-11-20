import React from "react";
import { BookOpen } from "lucide-react";
import LibraryPage from "../../components/library/LibraryPage";

const CONFIG = {
  kind: "books",
  noun: "book",
  icon: BookOpen,
  eyebrow: "Books",
  title: "My bookshelf",
  subtitle: "Every book I've finished, with honest thoughts and a rating — and the ones still waiting.",
  readKey: "books",
  wishlistKey: "books_wishlist",
  creatorLabel: "Author",
  creatorField: "author",
  hasYear: false,
  aiType: "books",
  genres: [
    "Literary Fiction", "Historical Fiction", "Science Fiction", "Fantasy",
    "Mystery", "Thriller", "Romance", "Non-Fiction", "Biography", "Poetry", "Other",
  ],
  readTab: "Read",
  wishTab: "Want to read",
  readWord: "read",
  wishWord: "on wishlist",
  favLabel: "Favourite read",
  finishedWord: "finished",
  dateLabel: "Date finished",
  logTitle: "Write about a book you read",
  logEyebrow: "Reading log",
  logCta: "Log a book",
  markTitle: "Log this book as read",
  markCta: "Mark as read",
  wishTitle: "Add a book to your wishlist",
  wishEyebrow: "Reading wishlist",
  verb: "read",
  pastVerb: "finished",
};

export default function Books() {
  return <LibraryPage config={CONFIG} />;
}
