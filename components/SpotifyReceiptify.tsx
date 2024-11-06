"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Music,
  Clock,
  Play,
  User,
  Calendar,
  Share2,
  BarChart2,
  RefreshCw,
  Heart,
  Headphones,
  MoreVertical,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import CustomizationPanel from "./CustomizationPanel";
import LoginPage from "./LoginPage";
import domtoimage from "dom-to-image";
import {
  getUserProfile,
  getTopTracks,
  createPlaylist,
  getUserStats,
  getTopArtists,
  getAvailableGenres,
} from "@/lib/spotifyData";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

interface Track {
  id: string;
  name: string;
  artist: string;
  duration: string;
  uri: string;
  album?: {
    images: Array<{
      url: string;
    }>;
  };
}

export default function SpotifyReceiptify() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [badge, setBadge] = useState("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [userStats, setUserStats] = useState({
    totalMinutesListened: 0,
    favoriteDayTime: "",
    topGenre: "",
    totalLikedSongs: 0,
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [displayDate, setDisplayDate] = useState<string>("");
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topGenres, setTopGenres] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [customization, setCustomization] = useState({
    metric: "top_tracks",
    tracks: 10,
    period: "short_term",
    mode: "dark",
    font: "sans",
  });
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (token) {
      setIsLoggedIn(true);
      loadUserData();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadUserData();
    }
  }, [
    isLoggedIn,
    customization.metric,
    customization.period,
    customization.tracks,
  ]);

  useEffect(() => {
    if (lastUpdated) {
      setDisplayDate(formatDate(lastUpdated));
    }
  }, [lastUpdated]);

  const loadUserData = async () => {
    try {
      setIsLoadingTracks(true); // Set loading state to true when starting

      // Load user profile data
      const userProfile = await getUserProfile();
      setUserName(userProfile.display_name);
      setBadge(userProfile.product);
      setProfileImage(userProfile.images[0]?.url);

      // Handle different metrics
      switch (customization.metric) {
        case "top_tracks":
          // Load tracks data
          const topTracks = await getTopTracks(
            customization.period,
            customization.tracks
          );

          // Wait for all tracks to be processed
          const formattedTracks = await Promise.all(
            topTracks.items.map(async (track: any) => ({
              id: track.id,
              name: track.name,
              artist: track.artists
                .map((artist: any) => artist.name)
                .join(", "),
              duration: formatDuration(track.duration_ms),
              uri: track.uri,
              album: track.album,
            }))
          );

          setTracks(formattedTracks);
          break;

        case "top_artists":
          const artistsData = await getTopArtists(
            customization.period,
            customization.tracks
          );
          setTopArtists(artistsData.items);
          break;

        case "top_genres":
          const genresData = await getAvailableGenres();
          setTopGenres(genresData.genres.slice(0, customization.tracks));
          break;

        case "stats":
          const stats = await getUserStats(customization.period);
          setUserStats(stats);
          break;
      }

      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading user data:", error);
      // Handle token-related errors
      if (
        error instanceof Error &&
        (error.message.includes("token") ||
          error.message.includes("unauthorized") ||
          error.message.includes("expired"))
      ) {
        // Clear tokens and reset login state
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
        localStorage.removeItem("token_expiration");
        setIsLoggedIn(false);

        toast.error("Session expired. Please login again.", {
          duration: 4000,
          position: "top-center",
        });
      } else {
        toast.error("Failed to load data. Please try again.", {
          duration: 3000,
          position: "top-center",
        });
      }
    } finally {
      setIsLoadingTracks(false); // Set loading state to false when done
    }
  };

  const handleShare = async () => {
    try {
      // Check if running on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Direct Instagram Story sharing on mobile
        const imageUrl = await domtoimage.toPng(receiptRef.current);
        window.location.href = `instagram://story?media=${encodeURIComponent(
          imageUrl
        )}`;
      } else {
        // Show dialog for PC users
        toast("Instagram story sharing is only available on mobile devices", {
          // Changed from toast.info
          duration: 3000,
          icon: "ℹ️",
        });

        // Fallback to regular sharing on PC
        if (navigator.share) {
          await navigator.share({
            title: "My Spotify Receiptify",
            text: "Check out my Spotify stats!",
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!", {
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share. Please try again.", {
        duration: 3000,
      });
    }
  };

  const handleCreatePlaylist = async (playlistName: string) => {
    try {
      setIsLoading(true);
      const trackUris = tracks.map((track) => track.uri);
      if (!userName) {
        throw new Error("Username not found");
      }
      await createPlaylist(userName, trackUris, playlistName);
      toast.success("Playlist created successfully!", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#1DB954",
          color: "#fff",
        },
      });
    } catch (error) {
      console.error("Error creating playlist:", error);
      if (error instanceof Error && error.message.includes("token")) {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
        localStorage.removeItem("token_expiration");
        setIsLoggedIn(false);
        toast.error("Session expired. Please login again.", {
          duration: 4000,
          position: "top-center",
        });
      } else {
        toast.error("Failed to create playlist. Please try again.", {
          duration: 3000,
          position: "top-center",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("spotify_access_token");
      const expiration = localStorage.getItem("token_expiration");

      if (!token || !expiration) {
        setIsLoggedIn(false);
        return;
      }

      // Check if token is expired
      if (Date.now() > parseInt(expiration)) {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
        localStorage.removeItem("token_expiration");
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      loadUserData();
    };

    checkAuth();
  }, []);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleRefreshData = async () => {
    await loadUserData();
  };

  const handleCustomize = (newCustomization: any) => {
    setCustomization(newCustomization);
    if (
      newCustomization.period !== customization.period ||
      newCustomization.tracks !== customization.tracks
    ) {
      loadUserData();
    }
  };

  const downloadAsImage = async () => {
    if (receiptRef.current) {
      try {
        // Store original styles
        const originalWidth = receiptRef.current.style.width;
        const originalHeight = receiptRef.current.style.height;

        // Set fixed width
        receiptRef.current.style.width = "758px";

        // Calculate height based on metric type and number of items
        let height;
        if (
          customization.tracks === 10 &&
          customization.metric !== "top_genres"
        ) {
          height = "1384px"; // Original height for 10 tracks/artists
        }

        // Generate the image with calculated dimensions
        const dataUrl = await domtoimage.toPng(receiptRef.current, {
          width: 758,
          height: parseInt(originalHeight),
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
        });

        // Restore original styles
        receiptRef.current.style.width = originalWidth;
        receiptRef.current.style.height = originalHeight;

        // Create and click download link
        const link = document.createElement("a");
        link.download = "spotify-receipt.png";
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }
  };

  // Format minutes to hours and minutes
  const formatListeningTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const calculateTotalDuration = (tracks: Track[]) => {
    const totalSeconds = tracks.reduce((acc, track) => {
      const [minutes, seconds] = track.duration.split(":").map(Number);
      return acc + minutes * 60 + seconds;
    }, 0);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getFontClass = (font: string) => {
    switch (font) {
      case "serif":
        return "font-serif";
      case "mono":
        return "font-mono";
      default:
        return "font-sans";
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen w-full p-2 sm:p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-7xl mx-auto">
        <Card
          ref={receiptRef}
          className={`w-full lg:w-3/5 border-none shadow-2xl rounded-xl overflow-hidden ${
            customization.mode === "dark" ? "bg-[#181818]" : "bg-white"
          } ${getFontClass(customization.font)}`}
        >
          {/* Header Section */}
          <CardHeader
            className={`border-b p-3 sm:p-6 ${
              customization.mode === "dark"
                ? "border-[#282828] bg-[#282828]"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <CardTitle
                className={`text-2xl sm:text-4xl font-bold flex items-center ${
                  customization.mode === "dark"
                    ? "text-[#1DB954]"
                    : "text-[#1DB954]"
                }`}
              >
                <Music className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
                <span>Receiptify+</span>
              </CardTitle>

              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-[#1DB954] border-[#1DB954] hover:bg-[#22c75c] hover:text-black"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share Receiptify</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-[#1DB954] border-[#1DB954] hover:bg-[#22c75c] hover:text-black"
                        onClick={handleRefreshData}
                        disabled={isLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            isLoading ? "animate-spin" : ""
                          }`}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh Data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Mobile dropdown */}
              <div className="flex sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-[#1DB954] border-[#1DB954] hover:bg-[#22c75c] hover:text-black h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-[#282828] border-[#1DB954]"
                  >
                    <DropdownMenuItem
                      onClick={handleShare}
                      className="text-white hover:text-black hover:bg-[#1DB954] cursor-pointer"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Receiptify
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleRefreshData}
                      disabled={isLoading}
                      className="text-white hover:text-black hover:bg-[#1DB954] cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          isLoading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* User Info Section */}
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt="Profile"
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <User className="w-5 h-5 text-[#1DB954]" />
                          )}
                          <span className="text-base sm:text-lg font-medium text-white">
                            {userName}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-[#1DB954] text-black hover:bg-[#22c55e] flex-shrink-0"
                        >
                          {badge}
                        </Badge>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72 sm:w-80 bg-[#282828] border-[#1DB954]">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Headphones className="w-4 h-4 text-[#1DB954]" />
                          <span className="text-white">
                            {formatListeningTime(
                              userStats.totalMinutesListened
                            )}{" "}
                            listened
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-[#1DB954]" />
                          <span className="text-white">
                            Most active: {userStats.favoriteDayTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Music className="w-4 h-4 text-[#1DB954]" />
                          <span className="text-white">
                            Top genre: {userStats.topGenre}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-[#1DB954]" />
                          <span className="text-white">
                            {userStats.totalLikedSongs} liked songs
                          </span>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#1DB954]" />
                  <span className="text-sm text-[#b3b3b3]">
                    {customization.period === "short_term"
                      ? "Last 4 weeks"
                      : customization.period === "medium_term"
                      ? "Last 6 months"
                      : "All time"}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#b3b3b3] flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last updated: {displayDate || "Loading..."}
              </div>
            </div>
          </CardHeader>

          {/* Content Section */}
          <CardContent
            className={`p-3 sm:p-6 ${
              customization.mode === "dark"
                ? "bg-gradient-to-b from-[#181818] to-[#282828]"
                : "bg-gradient-to-b from-white to-gray-50"
            }`}
          >
            <div className="text-xl sm:text-2xl font-semibold text-[#1DB954] mb-4 sm:mb-6">
              {customization.metric === "top_tracks" && "Your Top Tracks"}
              {customization.metric === "top_artists" && "Your Top Artists"}
              {customization.metric === "top_genres" && "Your Top Genres"}
              {customization.metric === "stats" && "Your Stats"}
            </div>

            {customization.metric === "top_tracks" && tracks.length > 0 && (
              <>
                {/* Top Track Card */}
                <div
                  className={`mb-6 sm:mb-8 ${
                    customization.mode === "dark"
                      ? "bg-[#1e1e1e]"
                      : "bg-gray-50"
                  } p-4 sm:p-6 rounded-lg shadow-lg relative overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1DB954] via-[#22c55e] to-[#1DB954]"></div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="flex-1">
                      <div
                        className={`text-2xl sm:text-3xl font-bold mb-2 text-center sm:text-left ${
                          customization.mode === "dark"
                            ? "text-white"
                            : "text-gray-900"
                        } ${getFontClass(customization.font)}`}
                      >
                        {tracks[0].name}
                      </div>
                      <div
                        className={`text-lg sm:text-xl text-[#1DB954] mb-4 text-center sm:text-left ${getFontClass(
                          customization.font
                        )}`}
                      >
                        {tracks[0].artist}
                      </div>
                      <div
                        className={`flex items-center justify-center sm:justify-start text-sm ${
                          customization.mode === "dark"
                            ? "text-[#b3b3b3]"
                            : "text-gray-600"
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {tracks[0].duration}
                      </div>
                    </div>
                    <div
                      className={`w-24 h-24 sm:w-32 sm:h-32 bg-[#1DB954] rounded-full flex items-center justify-center ${
                        customization.mode === "dark"
                          ? "border-[#1e1e1e]"
                          : "border-gray-50"
                      } border-8`}
                    >
                      {tracks[0].album?.images[0]?.url ? (
                        <img
                          src={tracks[0].album.images[0].url}
                          alt={tracks[0].name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ${
                            customization.mode === "dark"
                              ? "bg-[#1e1e1e]"
                              : "bg-gray-100"
                          }`}
                        >
                          <Music className="w-8 h-8 sm:w-12 sm:h-12 text-[#1DB954]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xl sm:text-2xl font-bold text-[#1DB954]">
                      #1 Top Track
                    </div>
                    <Button
                      className="w-full sm:w-auto bg-[#1DB954] hover:bg-[#22c55e] text-black"
                      onClick={() => {
                        const id = tracks[0].uri.split(":")[2];
                        window.open(
                          `https://open.spotify.com/track/${id}`,
                          "_blank"
                        );
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Open in Spotify
                    </Button>
                  </div>
                </div>

                {/* Track List */}
                {isLoadingTracks ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tracks.slice(1).map((track, index) => (
                      <div
                        key={track.id}
                        className="flex justify-between items-center group hover:bg-[#282828] p-2 sm:p-3 rounded-md transition-all duration-300 ease-in-out"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <span className="text-[#1DB954] w-6 text-right font-mono text-sm sm:text-base">
                            {(index + 2).toString().padStart(2, "0")}
                          </span>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#282828] flex items-center justify-center rounded-md overflow-hidden group-hover:bg-[#1DB954] transition-colors duration-300">
                            {track.album?.images[0]?.url ? (
                              <img
                                src={track.album.images[0].url}
                                alt={track.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-[#b3b3b3] group-hover:text-black transition-colors duration-300" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`font-medium transition-colors duration-300 text-sm sm:text-base ${
                                customization.mode === "dark"
                                  ? "text-white group-hover:text-[#1DB954]"
                                  : "text-gray-900 group-hover:text-[#1DB954]"
                              } ${getFontClass(customization.font)}`}
                            >
                              {track.name}
                            </div>
                            <div
                              className={`text-xs sm:text-sm text-[#b3b3b3] ${getFontClass(
                                customization.font
                              )}`}
                            >
                              {track.artist}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-[#b3b3b3] font-mono">
                          {track.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {customization.metric === "top_artists" && (
              <div className="space-y-6">
                {/* Top Artist Card */}
                {topArtists.length > 0 && (
                  <div className="mb-6 sm:mb-8 bg-[#1e1e1e] p-4 sm:p-6 rounded-lg shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1DB954] via-[#22c55e] to-[#1DB954]"></div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="flex-1">
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center sm:text-left">
                          {topArtists[0].name}
                        </div>
                        <div className="text-lg sm:text-xl text-[#1DB954] mb-4 text-center sm:text-left">
                          {topArtists[0].genres.slice(0, 2).join(", ")}
                        </div>
                        <div className="flex items-center justify-center sm:justify-start text-sm text-[#b3b3b3]">
                          <User className="w-4 h-4 mr-2" />
                          {topArtists[0].followers.total.toLocaleString()}{" "}
                          followers
                        </div>
                      </div>
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#1DB954] rounded-full flex items-center justify-center border-8 border-[#1e1e1e]">
                        {topArtists[0].images[0]?.url ? (
                          <img
                            src={topArtists[0].images[0].url}
                            alt={topArtists[0].name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#1e1e1e] rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 sm:w-12 sm:h-12 text-[#1DB954]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xl sm:text-2xl font-bold text-[#1DB954]">
                        #1 Top Artist
                      </div>
                      <Button
                        className="w-full sm:w-auto bg-[#1DB954] hover:bg-[#22c55e] text-black"
                        onClick={() =>
                          window.open(
                            topArtists[0].external_urls.spotify,
                            "_blank"
                          )
                        }
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Open in Spotify
                      </Button>
                    </div>
                  </div>
                )}

                {/* Artist List */}
                <div className="space-y-4">
                  {topArtists.slice(1).map((artist, index) => (
                    <div
                      key={artist.id}
                      className="flex justify-between items-center group hover:bg-[#282828] p-2 sm:p-3 rounded-md transition-all duration-300 ease-in-out"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="text-[#1DB954] w-6 text-right font-mono text-sm sm:text-base">
                          {(index + 2).toString().padStart(2, "0")}
                        </span>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#282828] flex items-center justify-center rounded-md overflow-hidden group-hover:bg-[#1DB954] transition-colors duration-300">
                          {artist.images[0]?.url ? (
                            <img
                              src={artist.images[0].url}
                              alt={artist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#b3b3b3] group-hover:text-black transition-colors duration-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-[#1DB954] transition-colors duration-300 text-sm sm:text-base">
                            {artist.name}
                          </div>
                          <div className="text-xs sm:text-sm text-[#b3b3b3]">
                            {artist.genres.slice(0, 2).join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-[#b3b3b3]">
                        {artist.followers.total.toLocaleString()} followers
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {customization.metric === "top_genres" && (
              <div className="space-y-6">
                {/* Top Genre Card */}
                {topGenres.length > 0 && (
                  <div className="mb-6 sm:mb-8 bg-[#1e1e1e] p-4 sm:p-6 rounded-lg shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1DB954] via-[#22c55e] to-[#1DB954]"></div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#1DB954] rounded-full flex items-center justify-center mb-4">
                        <Music className="w-12 h-12 sm:w-16 sm:h-16 text-black" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {topGenres[0]}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-[#1DB954]">
                        #1 Top Genre
                      </div>
                    </div>
                  </div>
                )}

                {/* Genre List */}
                <div className="space-y-4">
                  {topGenres.slice(1).map((genre, index) => (
                    <div
                      key={genre}
                      className="flex justify-between items-center group hover:bg-[#282828] p-2 sm:p-3 rounded-md transition-all duration-300 ease-in-out"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="text-[#1DB954] w-6 text-right font-mono text-sm sm:text-base">
                          {(index + 2).toString().padStart(2, "0")}
                        </span>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#282828] flex items-center justify-center rounded-md overflow-hidden group-hover:bg-[#1DB954] transition-colors duration-300">
                          <Music className="w-5 h-5 sm:w-6 sm:h-6 text-[#b3b3b3] group-hover:text-black transition-colors duration-300" />
                        </div>
                        <div className="font-medium text-white group-hover:text-[#1DB954] transition-colors duration-300 text-sm sm:text-base">
                          {genre}
                        </div>
                      </div>

                      {/* Genre popularity indicator */}
                      <div className="flex items-center space-x-2">
                        <div className="w-20 sm:w-24 bg-[#282828] rounded-full h-2">
                          <div
                            className="bg-[#1DB954] h-2 rounded-full"
                            style={{
                              width: `${
                                100 - (index + 1) * (100 / topGenres.length)
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {customization.metric === "stats" && (
              <div className="space-y-6">
                {/* Overall Stats Card */}
                <div className="mb-6 sm:mb-8 bg-[#1e1e1e] p-4 sm:p-6 rounded-lg shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1DB954] via-[#22c55e] to-[#1DB954]"></div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#1DB954] rounded-full flex items-center justify-center mb-4">
                      <BarChart2 className="w-12 h-12 sm:w-16 sm:h-16 text-black" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {formatListeningTime(userStats.totalMinutesListened)}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#1DB954]">
                      Total Listening Time
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Favorite Time */}
                  <div className="bg-[#282828] p-4 sm:p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-semibold text-white">
                        Favorite Time
                      </div>
                      <Clock className="w-5 h-5 text-[#1DB954]" />
                    </div>
                    <div className="text-3xl font-bold text-[#1DB954]">
                      {userStats.favoriteDayTime}
                    </div>
                    <div className="text-sm text-[#b3b3b3] mt-2">
                      Most active listening period
                    </div>
                  </div>

                  {/* Top Genre */}
                  <div className="bg-[#282828] p-4 sm:p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-semibold text-white">
                        Top Genre
                      </div>
                      <Music className="w-5 h-5 text-[#1DB954]" />
                    </div>
                    <div className="text-3xl font-bold text-[#1DB954]">
                      {userStats.topGenre}
                    </div>
                    <div className="text-sm text-[#b3b3b3] mt-2">
                      Most played music genre
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-4">
                  {/* Liked Songs */}
                  <div className="bg-[#282828] p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Liked Songs
                        </div>
                        <div className="text-sm text-[#b3b3b3]">
                          Total saved tracks
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#1DB954]">
                      {userStats.totalLikedSongs}
                    </div>
                  </div>

                  {/* Total Minutes */}
                  <div className="bg-[#282828] p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Total Minutes
                        </div>
                        <div className="text-sm text-[#b3b3b3]">
                          Time spent listening
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#1DB954]">
                      {userStats.totalMinutesListened}
                    </div>
                  </div>
                </div>

                {/* Time Distribution */}
                <div className="bg-[#282828] p-4 sm:p-6 rounded-lg">
                  <div className="text-lg font-semibold text-white mb-4">
                    Listening Time Distribution
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["Morning", "Afternoon", "Evening", "Night"].map(
                      (time) => (
                        <div
                          key={time}
                          className={`p-3 rounded-lg text-center ${
                            time === userStats.favoriteDayTime
                              ? "bg-[#1DB954] text-black"
                              : "bg-[#1e1e1e] text-[#b3b3b3]"
                          }`}
                        >
                          <div className="text-sm font-medium">{time}</div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer Section */}
          <Separator className="bg-[#282828]" />
          <CardFooter
            className={`flex flex-col sm:flex-row justify-between p-3 sm:p-6 ${
              customization.mode === "dark" ? "bg-[#282828]" : "bg-gray-50"
            } ${getFontClass(customization.font)}`}
          >
            <div className="flex items-center space-x-2 text-[#b3b3b3]">
              <Music className="w-4 h-4" />
              <span className="text-xs sm:text-sm">
                Total Tracks: {tracks.length}
              </span>
            </div>
            <div className="flex items-center text-neutral-400">
              <span className="text-xs sm:text-sm font-medium">
                spotify-receiptify.vercel.app
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[#b3b3b3]">
              <Clock className="w-4 h-4" />
              <span className="text-xs sm:text-sm">
                Total Time: {calculateTotalDuration(tracks)}
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Customization Panel */}
        <div className="w-full lg:w-2/5">
          <CustomizationPanel
            customization={customization}
            handleCustomize={handleCustomize}
            downloadAsImage={downloadAsImage}
            handleCreatePlaylist={handleCreatePlaylist}
            userName={userName}
            handleShare={handleShare}
          />
        </div>
      </div>
    </div>
  );
}
