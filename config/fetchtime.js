const axios = require('axios');

// async function time() {
//   try {
//     const response = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos');
//     const data = response.data;
//     const jointime = ` ${data.date} ${data.time}`;
    
//     return jointime
    
//   } catch (error) {
//     console.log('ddd', error);
//   }
// }

async function time() {
  const url = "https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos";
  const timeout = 5000; // 5 seconds timeout per request
  const maxTime = 180000; // 3 minutes in milliseconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxTime) {
    try {
      const response = await axios.get(url, { timeout });
      const data = response.data;
    const jointime = ` ${data.date} ${data.time}`
    return jointime
    } catch (error) {
      console.log("Error fetching time, retrying...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
  }

  console.log("Failed to fetch time after 3 minutes. Retrying...");
  return fetchTime(); // Restart the function after 3 minutes
}
module.exports = time

//console.log(tetx, tetx.year,  tetx.year, tetx.month, tetx.day, tetx.hour, tetx.minute, tetx.seconds);
