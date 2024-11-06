import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Music,
  Calendar,
  Type,
  PaintBucket,
  Download,
  PlayCircle,
  Instagram,
} from "lucide-react";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";

interface CustomizationPanelProps {
  customization: {
    metric: string;
    tracks: number;
    period: string;
    mode: string;
    font: string;
  };
  handleCustomize: (newCustomization: any) => void;
  downloadAsImage: () => void;
  handleCreatePlaylist?: (playlistName: string) => Promise<void>;
  userName: string;
  handleShare: () => void;
}

export default function CustomizationPanel({
  customization,
  handleCustomize,
  downloadAsImage,
  handleCreatePlaylist,
  userName,
  handleShare,
}: CustomizationPanelProps) {
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [tempTrackValue, setTempTrackValue] = useState(customization.tracks);

  const updateCustomization = (key: string, value: any) => {
    handleCustomize({
      ...customization,
      [key]: value,
    });
  };

  const onCreatePlaylist = async (playlistName: string) => {
    if (handleCreatePlaylist) {
      setIsCreatingPlaylist(true);
      try {
        await handleCreatePlaylist(playlistName);
        setShowPlaylistDialog(false);
        // You could add a success toast here
      } catch (error) {
        // You could add an error toast here
        console.error("Error creating playlist:", error);
      } finally {
        setIsCreatingPlaylist(false);
      }
    }
  };

  const handleCreatePlaylistClick = () => {
    setShowPlaylistDialog(true);
  };

  return (
    <Card className="w-full bg-[#181818] border-none shadow-2xl rounded-xl overflow-hidden">
      <CardHeader className="border-b border-[#282828] bg-[#282828] p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl font-bold text-[#1DB954] flex items-center">
          <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          Customize Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Grid layout for mobile optimization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Metric Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="metric"
              className="text-white flex items-center text-sm sm:text-base"
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Metric
            </Label>
            <Select
              value={customization.metric}
              onValueChange={(value) => updateCustomization("metric", value)}
            >
              <SelectTrigger
                id="metric"
                className="w-full bg-[#282828] border-none text-white text-sm sm:text-base h-9 sm:h-10"
              >
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent className="bg-[#282828] text-sm sm:text-base">
                <SelectItem value="top_tracks">Top Tracks</SelectItem>
                <SelectItem value="top_artists">Top Artists</SelectItem>
                <SelectItem value="top_genres">Top Genres</SelectItem>
                <SelectItem value="stats">Stats</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Period Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="period"
              className="text-white flex items-center text-sm sm:text-base"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Time Period
            </Label>
            <Select
              value={customization.period}
              onValueChange={(value) => updateCustomization("period", value)}
            >
              <SelectTrigger
                id="period"
                className="w-full bg-[#282828] border-none text-white text-sm sm:text-base h-9 sm:h-10"
              >
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent className="bg-[#282828] text-sm sm:text-base">
                <SelectItem value="short_term">Last 4 weeks</SelectItem>
                <SelectItem value="medium_term">Last 6 months</SelectItem>
                <SelectItem value="long_term">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tracks Slider */}
        <div className="space-y-2 pt-2">
          <Label
            htmlFor="tracks"
            className="text-white flex items-center text-sm sm:text-base"
          >
            <Music className="w-4 h-4 mr-2" />
            Top Tracks
          </Label>
          <Slider
            id="tracks"
            min={5}
            max={50}
            step={5}
            value={[tempTrackValue]}
            onValueChange={(value) => {
              setTempTrackValue(value[0]);
              setIsSliding(true);
            }}
            onValueCommit={(value) => {
              setIsSliding(false);
              updateCustomization("tracks", value[0]);
            }}
            className="[&>span:first-child]:bg-[#1DB954]"
          />
          <div className="text-[#b3b3b3] text-xs sm:text-sm">
            Number of tracks: {tempTrackValue}
            {isSliding && " (Release to update)"}
          </div>
        </div>

        {/* Grid layout for Mode and Font */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Mode Toggle */}
          <div className="space-y-2">
            <Label
              htmlFor="mode"
              className="text-white flex items-center text-sm sm:text-base"
            >
              <PaintBucket className="w-4 h-4 mr-2" />
              Mode
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="mode"
                checked={customization.mode === "dark"}
                onCheckedChange={(checked) =>
                  updateCustomization("mode", checked ? "dark" : "light")
                }
              />
              <Label
                htmlFor="mode"
                className="text-[#b3b3b3] text-sm sm:text-base"
              >
                Dark Mode
              </Label>
            </div>
          </div>

          {/* Font Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="font"
              className="text-white flex items-center text-sm sm:text-base"
            >
              <Type className="w-4 h-4 mr-2" />
              Font
            </Label>
            <Select
              value={customization.font}
              onValueChange={(value) => updateCustomization("font", value)}
            >
              <SelectTrigger
                id="font"
                className="w-full bg-[#282828] border-none text-white text-sm sm:text-base h-9 sm:h-10"
              >
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="bg-[#282828] text-sm sm:text-base">
                <SelectItem value="sans">Sans-serif</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="mono">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            className="w-full bg-[#1DB954] text-black hover:bg-[#22c55e] transition-colors duration-300 h-10 text-sm sm:text-base"
            onClick={downloadAsImage}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Images
          </Button>

          {/* Create Playlist Button - Only shown when metric is top_tracks */}
          {customization.metric === "top_tracks" && (
            <Button
              className="w-full bg-[#1DB954] text-black hover:bg-[#22c55e] transition-colors duration-300 h-10 text-sm sm:text-base"
              onClick={handleCreatePlaylistClick}
              disabled={isCreatingPlaylist}
            >
              {isCreatingPlaylist ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Create Playlist
                </>
              )}
            </Button>
          )}

          <CreatePlaylistDialog
            isOpen={showPlaylistDialog}
            onClose={() => setShowPlaylistDialog(false)}
            onConfirm={onCreatePlaylist}
            userName={userName}
          />

          {/* Share Section */}
          <div className="bg-[#282828] p-4 rounded-lg space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-[#1DB954]">
              Share Your Receiptify
            </h3>
            <p className="text-[#b3b3b3] text-xs sm:text-sm">
              Download your personalized Spotify Receiptify and share it on
              Instagram!
            </p>
            <Button
              className="w-full bg-gradient-to-r from-[#405DE6] via-[#5851DB] to-[#833AB4] text-white hover:opacity-90 transition-opacity duration-300 h-10 text-sm sm:text-base"
              onClick={handleShare}
            >
              <Instagram className="w-4 h-4 mr-2" />
              {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                ? "Share to Instagram Story"
                : "Share on Instagram"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
