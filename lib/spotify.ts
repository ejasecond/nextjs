import SpotifyWebApi from 'spotify-web-api-node';

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;

// Create a new instance of the Spotify Web API
export const spotify = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri,
});

// Scopes for authorization
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-read-recently-played'
];

// Login URL parameters
const params = {
  client_id: clientId,
  response_type: 'code',
  redirect_uri: redirectUri,
  scope: scopes.join(' '),
  show_dialog: 'true'
};

// Login URL
export const LOGIN_URL = `https://accounts.spotify.com/authorize?${new URLSearchParams(params)}`;