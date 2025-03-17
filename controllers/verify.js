const jwt = require("jsonwebtoken");
const Virexscheme = require("../model/Users");

const verify = async (req, res, next) => {
  console.log('Checking authentication...');

  const cookies = req.cookies;
  if (!cookies?.jwt) {
    console.log("No token found in cookies");
    return res.status(401).json({ message: "No token provided" });
  }

  const refreshToken = cookies.jwt;
  console.log('Token found:', refreshToken);

  const foundUser = await Virexscheme.findOne({ refreshToken }).exec();
  if (!foundUser) {
    console.log("Token does not match any user");
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRETY);

    if (!foundUser || foundUser.email !== decoded.email) {
      console.log("Email in token does not match user record");
      return res.status(403).json({ message: "Invalid email" });
    }

    console.log("Token is valid, proceeding to next middleware...");
    req.user = foundUser; // Attach user info for later use
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.log("Token has expired");
      return res.status(403).json({ message: "Token expired" });
    } else {
      console.log("Error verifying token:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
  }
};

module.exports = verify;
