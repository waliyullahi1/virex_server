const axios = require("axios");

async function getTime() {
  try {
    const response = await axios.get(
      "https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos"
    );

    // Log response to confirm structure
    console.log("API Response:", response.data);

    const { dateTime } = response.data; // Check if `dateTime` exists

    if (!dateTime) throw new Error("Invalid response format");

    return new Date(dateTime); // Ensure it's a valid Date object
  } catch (error) {
    console.error("Error fetching time:", error);
    return new Date(); // Fallback to system time if API fails
  }
}

module.exports = getTime;
