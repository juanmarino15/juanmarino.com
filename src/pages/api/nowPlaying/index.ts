import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

let ACCESS_TOKEN = 'BQAGV6c0dYkR6slGONdVKlK9XjTEg1iUYZIM5Ri3XsF6pA6gY3ibEKptfzh6t1afn2rfDPZd_rle2-Lrion3WrHpTRmB6RCC6gt9KU3PzuOCTsIM8Q6WVP38Uu81sHb8-mncmI7XcROApH_s4Jxz1_Ugz_EenbYMZctxc_ZayYxg6-EliHdWGApu68sA';
const REFRESH_TOKEN = 'AQA8jez5RrcYyCcszBHOWVKUio5nsb7VdbafMKs4GhpA6bICsy0j4_UciCgUGJchrDc1k6SyGjuuwya9VV90NtH73Ut6rJEgn5A6KZe7hN9YzJnQZKN5pGKU60H5cgzVYgw';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const processTrack = (item: any, live: boolean) => {
  let bestImage;
  for (const image of (item.images || item.album.images).reverse()) {
    if (image.height >= 120) {
      bestImage = image.url;
      break;
    }
  }
  return {
    name: item.name,
    artists: item.show ? [item.show.name] : item.artists.map((artist: any) => artist.name),
    album: item.album?.name || item.release_date,
    image: bestImage,
    live: live,
    link: item.external_urls.spotify,
  };
};

const getPreviousTrack = async () => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=1`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );
    if (response.status === 200) {
      const json: any = await response.json();
      if (json.items && json.items.length > 0) {
        return processTrack(json.items[0].track, false);
      } else {
        throw new Error('No recently played tracks found.');
      }
    } else if (response.status === 403) {
      const errorText = await response.text();
      throw new Error(`Forbidden: ${errorText}`);
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to fetch recently played tracks, status: ${response.status}, error: ${errorText}`);
    }
  } catch (e) {
    console.error('Error fetching previous track:', e);
    throw e;
  }
};

const refreshAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("refresh_token", REFRESH_TOKEN);
  params.append("grant_type", "refresh_token");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: params,
    headers: {
      Authorization: `Basic ${Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
  });

  if (response.status === 200) {
    const json: any = await response.json();
    ACCESS_TOKEN = json.access_token;
    return json.access_token;
  } else {
    const errorText = await response.text();
    throw new Error(`Failed to refresh access token, status: ${response.status}, error: ${errorText}`);
  }
};

const getLastSong = async (recursion = true): Promise<any> => {
  try {
    let response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode,track",
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (response.status === 204) {
      // No currently playing song
      return await getPreviousTrack();
    } else if (response.status === 401) {
      // Unauthorized, possibly due to an expired token
      if (!recursion) {
        throw new Error("Reached max recursion depth");
      }
      await refreshAccessToken();
      return await getLastSong(false);
    } else if (response.status === 200) {
      const json: any = await response.json();
      if (json.currently_playing_type === "ad" || !json.item) {
        // No valid track playing, fallback to recently played
        return await getPreviousTrack();
      }
      return processTrack(json.item, true);
    } else {
      const errorText = await response.text();
      throw new Error(`Spotify did not return 200, 204, or 401. Returned status: ${response.status}, error: ${errorText}`);
    }
  } catch (e) {
    console.error('Error fetching last song:', e);
    throw e;
  }
};

export async function get() {
  try {
    const song = await getLastSong();
    return new Response(JSON.stringify(song), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    });
  } catch (e) {
    console.error("Error in handler:", e);
    return new Response(JSON.stringify({ error: 'Failed to fetch now playing track' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
