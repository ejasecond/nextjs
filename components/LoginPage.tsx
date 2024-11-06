import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music } from "lucide-react";
import { LOGIN_URL } from "@/lib/spotify";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = LOGIN_URL;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1DB954] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#181818] border-none shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-[#1DB954] flex items-center justify-center">
            <Music className="w-8 h-8 mr-2" />
            Receiptify+
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-white text-lg">
              Generate your personalized Spotify listening receipt
            </p>
            <p className="text-sm text-[#b3b3b3]">
              Connect with your Spotify account to see your top tracks and
              listening stats
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-[#1DB954] text-black hover:bg-[#1ed760] transition-colors duration-300 h-12"
          >
            {isLoading ? (
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
                Connecting to Spotify...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Music className="w-5 h-5 mr-2" />
                Connect with Spotify
              </span>
            )}
          </Button>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#282828]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#181818] px-2 text-[#b3b3b3]">
                  Features
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-[#b3b3b3]">✓ Top Tracks Analysis</div>
              <div className="text-[#b3b3b3]">✓ Listening Statistics</div>
              <div className="text-[#b3b3b3]">✓ Create Playlists</div>
              <div className="text-[#b3b3b3]">✓ Share with Friends</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-[#b3b3b3]">
          <p>
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-xs">
            This app uses official Spotify API and does not store your password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
