"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import SpotifyReceiptify from "../components/SpotifyReceiptify";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading or add your actual data fetching here
    const loadData = async () => {
      try {
        // Add your fetch calls here
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (error) {
        console.error("Loading error:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1DB954] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1DB954] text-white flex flex-col">
      <Header />
      <SpotifyReceiptify />
    </div>
  );
}
