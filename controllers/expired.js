const EXPIRATION_TIME = 60 * 1000; // 1 minute in milliseconds

const isCodeExpired = (createdAt) => {
  const expired = Date.now() > new Date(createdAt).getTime() + EXPIRATION_TIME;
  return expired ? "Expired" : "Not Expired";
};

module.exports = isCodeExpired;
