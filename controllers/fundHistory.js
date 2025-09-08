const Found = require('../model/fund'); 
const axios = require('axios')
const User = require("../model/Users");

const fundHistory = async (req, res)=>{

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) return res.status(401).json({ message: 'no user fund' })
    const email = foundUser.email;
    
       const fund = await Found.find({ email:email }) 
        res.json(fund)
  
   
     
}



module.exports= fundHistory

