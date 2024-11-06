import { spotify } from './spotify';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export const exchangeCodeForTokens = async (code: string): Promise<TokenResponse> => {
  if (!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.NEXT_PUBLIC_REDIRECT_URI) {
    throw new Error('Missing required environment variables');
  }

  try {
    // Validate inputs
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid authorization code');
    }

    const params = new URLSearchParams({
      code,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    // Log request details for debugging (remove in production)
    console.log('Token exchange request details:', {
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
      codeLength: code.length,
      hasClientId: !!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64')
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      // Enhanced error handling with specific error messages
      if (response.status === 400) {
        const errorMessage = data.error_description || data.error || 'Bad Request';
        if (errorMessage.includes('invalid_grant')) {
          throw new Error('Authorization code expired or already used. Please try logging in again.');
        }
        if (errorMessage.includes('redirect_uri_mismatch')) {
          throw new Error('Redirect URI mismatch. Please check your app settings.');
        }
      }
      throw new Error(`Token exchange failed: ${data.error_description || data.error || response.statusText}`);
    }

    // Validate response data
    if (!data.access_token) {
      throw new Error('Token response missing access_token');
    }

    return data;
  } catch (error) {
    // Add error context for better debugging
    const enhancedError = error instanceof Error 
      ? error
      : new Error('Unknown error during token exchange');
    
    console.error('Detailed token exchange error:', {
      message: enhancedError.message,
      stack: enhancedError.stack,
      timestamp: new Date().toISOString()
    });
    
    throw enhancedError;
  }
};

export const refreshAccessToken = async (refresh_token: string): Promise<TokenResponse> => {
  if (!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error('Missing required environment variables');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64')
    },
    body: params
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${data.error}`);
  }

  return data;
};

export const handleSpotifyCallback = async (code: string) => {
  try {
    const tokens = await exchangeCodeForTokens(code);
    
    // Use spotify instead of spotifyApi
    spotify.setAccessToken(tokens.access_token);
    if (tokens.refresh_token) {
      spotify.setRefreshToken(tokens.refresh_token);
    }

    // Store tokens in localStorage for persistence
    localStorage.setItem('spotify_access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
    }
    localStorage.setItem('spotify_token_expiry', (Date.now() + tokens.expires_in * 1000).toString());

    return tokens;
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    throw error;
  }
};