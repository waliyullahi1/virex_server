

const Virexscheme = require('../model/Users');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const { emaillOrPhone, pwd } = req.body;
  if (!emaillOrPhone || !pwd) return res.status(400).json({ message: "Username and password are required." });


  const isPhoneNumber = /^\d+$/.test(emaillOrPhone);
  console.log("Searching for:", emaillOrPhone, "Detected as:", isPhoneNumber ? "Phone Number" : "Email");

  // Declare foundUser variable
  let foundUser;

  if (!isPhoneNumber) {
    console.log('Logging in with email');
    foundUser = await Virexscheme.findOne({ email: emaillOrPhone }).exec();
  } else {
    console.log('Logging in with phone number');
    foundUser = await Virexscheme.findOne({ phone: emaillOrPhone }).exec();
  }

  console.log("Found User:", foundUser);

  if (!foundUser) return res.status(402).json({ message: "Invalid email" });
  console.log(foundUser);
  

  // Evaluate password
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (!match) return res.status(402).json({ message: "Invalid email or password" });

  const roles = Object.values(foundUser.roles);

  // Generate tokens
  const accessToken = jwt.sign(
    { UserInfo: { email: foundUser.email, roles } },
    process.env.ACCESS_TOKEN_SECRETY,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { email: foundUser.email },
    process.env.REFRESH_TOKEN_SECRETY,
    { expiresIn: "1h" } // Refresh token should last longer (e.g., 1 day)
  );

  // Save refresh token in DB
  foundUser.refreshToken = refreshToken;
  await foundUser.save();

  // Set refresh token as HTTP-Only cookie
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  
  res.json({ accessToken });
};

module.exports = { handleLogin };
