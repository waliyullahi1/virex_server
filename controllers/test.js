const Code = require("../model/test");
const getTime = require("./time");
const isCodeExpired = require("./isCodeExpired");

const generateRandomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const saveCode = async () => {
  const currentTime = await getTime();

  const newCode = new Code({
    code: generateRandomCode(),
    createdAt: currentTime,
  });

  await newCode.save();
  console.log(`Generated Code: ${newCode.code} - Created At: ${currentTime} - Status: Active`);

  // Check status every 10 seconds
  const interval =  setInterval(async() => {
    const status = await isCodeExpired(newCode.createdAt);
    console.log(`Code: ${newCode.code} - Status: ${status}`);

    // Stop checking once it expires
    // if (status === "Expired") {
    //   clearInterval(interval);
    // }
  }, 10 * 1000); // Runs every 10 seconds
};

module.exports = saveCode;
