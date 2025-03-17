const axios = require("axios");

const EXPIRATION_TIME = 60 * 1000; // 1 minute

async function getTime() {
  try {
    const response = await axios.get(
      "https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos"
    );
    return new Date(`${response.data.date}T${response.data.time}`).getTime();
  } catch (error) {
    console.error("Error fetching time:", error);
    return null; // Return null if API fails
  }
}

async function isCodeExpired(createdAt) {
  const currentTime = await getTime(); // Fetch time from API
  if (!currentTime) return "Unknown (API Failed)"; // Handle API failure

  const expired = currentTime > new Date(createdAt).getTime() + EXPIRATION_TIME;
  return expired ? "Expired" : "Not Expired";
}

module.exports = isCodeExpired;
