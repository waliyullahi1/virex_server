const smsSave = require('../model/sms')
const axios = require('axios')
const  time = require("../config/fetchtime")
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const smsSaves = async (  email, PhoneNumber, amount, country, app) =>{
   const transadate = await time()
   
     const sms_Token = jwt.sign(
       { UserInfo: { phone: PhoneNumber, email:email } },
       process.env.ACCESS_TOKEN_SECRETY,
       { expiresIn: "50m" }
     );
   
   
const newsms = new smsSave({
    email:email,
    transactiondate: transadate,
    Phone_Number:PhoneNumber,
    Country: country,
    App: app,
    Amount: amount*400,
    token:  sms_Token,
  
 
});
console.log(newsms);

newsms.save()
  
console.log(newsms);

}


module.exports = smsSaves;