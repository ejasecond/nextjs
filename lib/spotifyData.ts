import { spotify } from './spotify';
import { refreshAccessToken } from './auth';

const checkAndRefreshToken = async () => {
  const token = localStorage.getItem('spotify_access_token');
  const expiryTime = localStorage.getItem('token_expiration');
  
  if (!token || !expiryTime) {
    throw new Error('No token available');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  if (Date.now() > parseInt(expiryTime) - 300000) {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const newTokens = await refreshAccessToken(refreshToken);
      
      localStorage.setItem('spotify_access_token', newTokens.access_token);
      if (newTokens.refresh_token) {
        localStorage.setItem('spotify_refresh_token', newTokens.refresh_token);
      }
      localStorage.setItem('token_expiration', (Date.now() + newTokens.expires_in * 1000).toString());
      
      spotify.setAccessToken(newTokens.access_token);
      return newTokens.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  return token;
};


export const getUserProfile = async () => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getMe();
  return response.body;
};

export const getTopTracks = async (timeRange: string, limit: number) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getMyTopTracks({ 
    time_range: timeRange, 
    limit 
  });
  return response.body;
};


// Get top artists
export const getTopArtists = async (timeRange: string, limit: number) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getMyTopArtists({ 
    time_range: timeRange, 
    limit 
  });
  return response.body;
};

// Get user's saved tracks count
export const getSavedTracksCount = async () => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getMySavedTracks({ limit: 1 });
  return response.body.total;
};

// Get recently played tracks
export const getRecentlyPlayed = async (limit: number) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getMyRecentlyPlayedTracks({ 
    limit 
  });
  return response.body;
};

// Get user's playlists
export const getUserPlaylists = async (limit: number) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getUserPlaylists({ 
    limit 
  });
  return response.body;
};

// Get audio features for tracks
export const getAudioFeatures = async (trackIds: string[]) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getAudioFeaturesForTracks(trackIds);
  return response.body;
};

// Get recommendations based on seeds
export const getRecommendations = async (options: {
  seed_tracks?: string[];
  seed_artists?: string[];
  seed_genres?: string[];
  limit?: number;
}) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getRecommendations(options);
  return response.body;
};

// Add tracks to playlist
export const addTracksToPlaylist = async (playlistId: string, trackUris: string[]) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  await spotify.addTracksToPlaylist(playlistId, trackUris);
};

// Remove tracks from playlist
export const removeTracksFromPlaylist = async (playlistId: string, trackUris: string[]) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  await spotify.removeTracksFromPlaylist(playlistId, trackUris);
};

// Get available genres
export const getAvailableGenres = async () => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getAvailableGenreSeeds();
  return response.body;
};

// Get user's followed artists
export const getFollowedArtists = async () => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.getFollowedArtists({ limit: 50 });
  return response.body;
};

// Search Spotify
export const searchSpotify = async (query: string, types: string[]) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  const response = await spotify.search(query, types);
  return response.body;
};

export const createPlaylist = async (userName: string, trackUris: string[], playlistName?: string) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  
  // Create the playlist with custom name or default
  const finalPlaylistName = playlistName || `${userName || 'My'}'s Top Tracks`;
  
  const playlist = await spotify.createPlaylist(finalPlaylistName, {
    description: 'Created with Spotify Receiptify+',
    public: false
  });
  
  // Add tracks to the playlist
  if (trackUris.length > 0) {
    await spotify.addTracksToPlaylist(playlist.body.id, trackUris);
  }
  
  return playlist.body;
};

// Get user statistics
export const getUserStats = async (timeRange: string) => {
  const token = await checkAndRefreshToken();
  spotify.setAccessToken(token);
  
  try {
    // Get user's saved tracks
    const savedTracks = await spotify.getMySavedTracks({ limit: 1 });
    
    let recentTracks = null;
    let favoriteDayTime = 'Not available';
    let totalMinutesListened = 0;
    
    try {
      recentTracks = await spotify.getMyRecentlyPlayedTracks({ 
        limit: 50
      });

      // Calculate favorite day time based on time range
      favoriteDayTime = calculateFavoriteDayTime(
        recentTracks.body.items,
        timeRange
      );

      // Calculate total minutes with time range consideration
      totalMinutesListened = calculateTotalMinutes(
        recentTracks.body.items,
        timeRange
      );

    } catch (error) {
      console.warn('Unable to fetch recently played tracks:', error);
    }
    
    // Get user's top artists with time range
    const topArtists = await spotify.getMyTopArtists({ 
      limit: 20,
      time_range: timeRange
    });
    const topGenre = calculateTopGenre(topArtists.body.items);
    
    return {
      totalMinutesListened,
      favoriteDayTime,
      topGenre,
      totalLikedSongs: savedTracks.body.total,
      timeRange
    };
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching user stats: ${error.message}`);
    } else {
      throw new Error('Error fetching user stats');
    }
  }
};

// Update calculateFavoriteDayTime to consider time range
const calculateFavoriteDayTime = (recentTracks: any[], timeRange: string) => {
  const hours = recentTracks.map(track => 
    new Date(track.played_at).getHours()
  );
  
  const timeSlots = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0
  };
  
  hours.forEach(hour => {
    if (hour >= 5 && hour < 12) timeSlots.Morning++;
    else if (hour >= 12 && hour < 17) timeSlots.Afternoon++;
    else if (hour >= 17 && hour < 22) timeSlots.Evening++;
    else timeSlots.Night++;
  });

  // Apply weight based on time range
  const multiplier = getTimeRangeMultiplier(timeRange);
  Object.keys(timeSlots).forEach(slot => {
    timeSlots[slot as keyof typeof timeSlots] *= multiplier;
  });
  
  return Object.entries(timeSlots).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0];
};

const calculateTopGenre = (artists: any[]) => {
  const genres = artists.flatMap(artist => artist.genres);
  const genreCounts = genres.reduce((acc: {[key: string]: number}, genre: string) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(genreCounts).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0] || 'N/A';
};

const getTimeRangeMultiplier = (timeRange: string) => {
  switch (timeRange) {
    case 'short_term': // 4 weeks
      return 1;
    case 'medium_term': // 6 months
      return 6;
    case 'long_term': // All time (approximately 1 year)
      return 12;
    default:
      return 1;
  }
};

const calculateTotalMinutes = (recentTracks: any[], timeRange: string) => {
  // Base calculation from recent tracks
  const averageTrackDuration = 3.5; // minutes
  const baseMinutes = Math.floor(recentTracks.length * averageTrackDuration);
  
  // Apply multiplier based on time range
  const multiplier = getTimeRangeMultiplier(timeRange);
  return baseMinutes * multiplier;
};
