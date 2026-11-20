import React from "react";
import { Film } from "lucide-react";
import LibraryPage from "../../components/library/LibraryPage";

const CONFIG = {
  kind: "films",
  noun: "film",
  icon: Film,
  eyebrow: "Films",
  title: "My film log",
  subtitle: "Every film I've seen, rated and remembered — plus the ones on my watchlist.",
  readKey: "movies",
  wishlistKey: "movies_wishlist",
  creatorLabel: "Director",
  creatorField: "director",
  hasYear: true,
  aiType: "movies",
  genres: [
    "Drama", "Comedy", "Action", "Thriller", "Science Fiction", "Fantasy",
    "Horror", "Romance", "Animation", "Documentary", "Other",
  ],
  readTab: "Watched",
  wishTab: "Want to watch",
  readWord: "watched",
  wishWord: "on watchlist",
  favLabel: "Favourite film",
  finishedWord: "watched",
  dateLabel: "Date watched",
  logTitle: "Write about a film you watched",
  logEyebrow: "Film log",
  logCta: "Log a film",
  markTitle: "Log this film as watched",
  markCta: "Mark as watched",
  wishTitle: "Add a film to your watchlist",
  wishEyebrow: "Watchlist",
  verb: "watch",
  pastVerb: "watched",
};

export default function Movies() {
  return <LibraryPage config={CONFIG} />;
}
