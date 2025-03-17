const jwt = require("jsonwebtoken");
const Virexscheme = require("../model/Users");

const handleRefreshToken = async (req, res) => {

  const cookies = req.cookies;
 
   
  if (!cookies?.jwt) {
   
    
    return res.status(401).json({ message: "No token provided" });
  }

  const refreshToken = cookies.jwt;


  
  // Find user with the refresh token
  const foundUser = await Virexscheme.findOne({ refreshToken }).exec();
  if (!foundUser) return res.sendStatus(403); // Forbidden
  
  
  // Verify the refresh token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRETY, (err, decoded) => {
 
    if (err || foundUser.email !== decoded.email) return res.sendStatus(403);
    
    
    const roles = Object.values(foundUser.roles);
    
    // Generate a new access token
    const accessToken = jwt.sign(
      {
        "UserInfo": {
          "email": foundUser.email,
          "roles": roles
        }
      },
      process.env.ACCESS_TOKEN_SECRETY,
      { expiresIn: "7s" } // Set the expiration time for the new access token
    );
    console.log('ished procesing');
    
    res.json({ accessToken });
  });
};

module.exports =  handleRefreshToken ;
