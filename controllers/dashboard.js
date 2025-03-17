const Virexscheme = require('../model/Users');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");








const dashboard = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const foundUser = await Virexscheme.findOne({ refreshToken }).exec();

 
  if (!foundUser) return res.sendStatus(403);
  if (foundUser.account_number === null) {
    res.json({ foundUser })   
    return
  }

  

 
  


  res.json({ foundUser }) 
};

module.exports = dashboard;
