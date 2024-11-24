import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const AUTHORIZATION_CODE = 'AQC9b78yXg7NxOJunF76wFk3EjCgFxDNzHBP3vECMYWmsQPEXd6cJj-J-6B_oXToSHfAI7NZcCl61JaeKkUE2ZbdgezZykOH0G7ifengyEbf746PPGqUQqmxK45gNGa6_hc1OQNhJTauSt93Hw56zp0UPLKRsthRVCFz6PY128-vo5MkiHOIlmyVr1boJkLtxOGk9ECcTQNhfDg3ix1BF9h1uH4uQz-dcUfO2zY8'; // Replace with your authorization code

const getAccessToken = async (authorizationCode) => {
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", authorizationCode);
  params.append("redirect_uri", REDIRECT_URI);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: params,
    headers: {
      "Authorization": `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Access Token:', data.access_token);
    console.log('Refresh Token:', data.refresh_token);
    return data;
  } else {
    const errorText = await response.text();
    console.error('Failed to fetch access token:', response.status, errorText);
    throw new Error(`Failed to fetch access token: ${response.status}`);
  }
};

(async () => {
  try {
    const tokenData = await getAccessToken(AUTHORIZATION_CODE);
    console.log('Token Data:', tokenData);
  } catch (error) {
    console.error('Error:', error);
  }
})();
