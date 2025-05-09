const Transaction = require('../model/Transactions'); 
const User = require("../model/Users");
const checktracsaction =require('./Checktransaction')

const transactionHistory = async (req, res)=>{

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
  
    const foundUser = await User.findOne({ refreshToken }).exec();
    const email = foundUser.email
    await checktracsaction(email)

    const transactions = await Transaction.find({ user:email,
        status: { $in: ['success', 'pending'] }
     }).sort({arrangedate: -1}); 
    res.json(transactions)
}


module.exports=transactionHistory