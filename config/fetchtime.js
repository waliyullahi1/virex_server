const axios = require('axios');

async function time() {
  try {
    const response = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos');
    const data = response.data;
    const jointime = ` ${data.date} ${data.time}`;
    
    return jointime
    
  } catch (error) {
    console.log('ddd', error);
  }
}

module.exports = time

//console.log(tetx, tetx.year,  tetx.year, tetx.month, tetx.day, tetx.hour, tetx.minute, tetx.seconds);
