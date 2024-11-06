"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAttemptedExchange = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasAttemptedExchange.current) {
        return;
      }
      hasAttemptedExchange.current = true;

      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        router.push(`/?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!code) {
        router.push("/?error=no_code");
        return;
      }

      try {
        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || data.details || "Failed to exchange code for tokens"
          );
        }

        // Store tokens
        localStorage.setItem("spotify_access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("spotify_refresh_token", data.refresh_token);
        }

        // Store expiration time
        const expiresIn = data.expires_in;
        const expirationTime = new Date().getTime() + expiresIn * 1000;
        localStorage.setItem("token_expiration", expirationTime.toString());

        // Redirect to home page
        router.push("/");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        router.push(`/?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1DB954] flex items-center justify-center">
      <div className="bg-[#181818] p-8 rounded-lg shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DB954]"></div>
          <h2 className="text-xl font-semibold text-white">
            Authenticating with Spotify...
          </h2>
          <p className="text-[#b3b3b3]">
            Please wait while we complete the process
          </p>
        </div>
      </div>
    </div>
  );
}
