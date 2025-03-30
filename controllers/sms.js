const User = require("../model/Users");
const smsSave = require('../model/sms')
const axios = require('axios')
const smsSaves = require('./savesms')

const jwt = require("jsonwebtoken");




const get_rates = async (req, res) => {
  const country = req.params.country
  if (!country) return res.status(400).json({ "message": "country is need" });
  try {
    const response = await axios.get(`http://pvacodes.com/user/api/get_rates.php?country=${country}`);

    return res.json(response.data)
  } catch (error) {
    console.error(error);
  }
}

const generateNumber = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;


  const foundUser = await User.findOne({ refreshToken }).exec();
if(foundUser) {
  const { country, app } = req.body;
  if (!country || !app) { return res.status(400).json({ message: "Country and app are required." }); }


  try {


    const response1 = await axios.get(`http://pvacodes.com/user/api/get_rates.php?country=${country}`);
    const apps = response1.data

    const matchingApp = apps.find(element => element.app === app);
    console.log(matchingApp);

    if (Number(matchingApp.rate) * 400 < foundUser.walletBalance) {
      console.log(Number(matchingApp.rate), Number(matchingApp.rate) * 400);
      try {
        const response = await axios.get(`http://pvacodes.com/user/api/get_number.php`,
          {
            params: {
              customer: process.env.PVACODE, // Replace with your actual customer key
              app: app,
              country: country,
            },
          }
        );
        const errors = ['App Not Found.', 'No free channels available check after sometime.', 'Not Enough balance', 'Customer Not Found.', 'New Numbers registration in progress, please wait or check back later.', 'Error 102, check back later.'];
        console.log(response.data, 'error data');
        console.log(response, 'error data');
        if (errors.includes(response.data)) {

          console.log(response.data, 'error is the matter');
          res.status(200).json(response.data);
        } else {
          console.log('go');

          const savenumber = await smsSaves(foundUser.email, response.data, matchingApp.rate, country, app)
          console.log(savenumber);
          res.json('Number generate successful ')
        }


      } catch (error) {
        console.log(error);

        res.status(403).json({ "message": " insufficient balance  " });
      }

    } else {
      console.log('insufficent ');
      res.status(500).json({ "message": " insufficent balance , fund your wallet " });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}
 
};

const showNumber = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;


  const foundUser = await User.findOne({ refreshToken }).exec();
  const email = foundUser.email;

  const sms = await smsSave.find({ email });

  res.json(sms);
}



const otp = async (req, res) => {

  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) return res.sendStatus(403);  // Handle missing user

  const { country, app, phoneNumber } = req.body;

  const number_found = await smsSave.findOne({ Phone_Number: phoneNumber }).exec();
  console.log(number_found);
  
  if (!number_found) return res.status(404).json({ message: "Phone number not found" });
  if (number_found.token == ''){
    number_found.status == 'expired';
    await foundUser.save();
    console.log('fffff')
    return res.status(404).json({ message: "Phone number is expired" });
  } 

  try {
    const decoded = jwt.verify(number_found.token, process.env.ACCESS_TOKEN_SECRETY);
      console.log(decoded);
    if (number_found.email !== decoded.UserInfo.email) {
      console.log("Email in token does not match user record");
      return res.status(403).json({ message: "Invalid email" });
    }

    console.log("Token is valid, proceeding to next middleware...");

   
    
    
    if (number_found.Amount > foundUser.walletBalance) {
      console.log('Insufficient balance');
      return res.status(400).json({ message: "Insufficient balance, fund your wallet" });
    }

    if (!country || !app) {
      return res.status(400).json({ message: "Country and app are required." });
    }

    try {
      const response = await axios.get(`http://pvacodes.com/user/api/get_sms.php`, {
        params: { customer: process.env.PVACODE, app, number: phoneNumber, country },
      });

      const errors = ['Customer Not Found.', 'Number Not Found.', 'You have not received any code yet.', 'Your balance is expired.', 'Error 102, check back later.'];

      if (errors.includes(response.data)) {
        console.log(response.data);
        
        return res.status(400).json({ message: response.data });
      }
     
      
      foundUser.walletBalance -= number_found.Amount ;
      console.log(  foundUser.walletBalance  );
        number_found.Activation_Code = response.data;
        await foundUser.save();
        console.log(  foundUser.walletBalance  );

        number_found.status = 'expired';
        number_found.token=''
        number_found.new_bal =  foundUser.walletBalance
       
        await number_found.save();
        console.log(number_found);
      


      
      
    

      return res.json({ message: "Successful" });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An unexpected error occurred." });
    }

  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.log("Token has expired");
      number_found.status = 'expired';
      await number_found.save();
      return res.status(403).json({ message: "Token expired" });
    } else {
      console.log("Error verifying token:", err.message);
      number_found.status = 'expired';
      await number_found.save();
      return res.status(403).json({ message: "Invalid token" });
    }
  }
};


// const otp = async (req, res) => {
//   const cookies = req.cookies;
//   if (!cookies?.jwt) return res.sendStatus(401);
//   const refreshToken = cookies.jwt;
//   const foundUser = await User.findOne({ refreshToken }).exec();
//   if (foundUser) {
//     const { country, app, phoneNumber } = req.body;


//     const number_found = await smsSave.findOne({ Phone_Number: phoneNumber }).exec();

//     try {
//       const decoded = jwt.verify(number_found.token, process.env.ACCESS_TOKEN_SECRETY);
//       console.log(decoded.UserInfo.email, number_found.email);

//       if (!number_found || number_found.email !== decoded.UserInfo.email) {
//         console.log("Email in token does not match user record");
//         return res.status(403).json({ message: "Invalid email" });
//       }

//       console.log("Token is valid, proceeding to next middleware...");

//       try {

//         const response1 = await axios.get(`http://pvacodes.com/user/api/get_rates.php?country=${country}`);
//         const apps = response1.data

//         const matchingApp = apps.find(element => element.app === app);
//         console.log(matchingApp, 'ddddd');

//         if (Number(matchingApp.rate) * 400 < foundUser.walletBalance) {

//           if (!country || !app) { return res.status(400).json({ message: "Country and app are required." }); }
//           try {
//             const response = await axios.get(`http://pvacodes.com/user/api/get_sms.php`,
//               {
//                 params: {
//                   customer: process.env.PVACODE,
//                   app: app,
//                   number: phoneNumber,
//                   country: country,

//                 },
//               }
//             );
//             const errors = ['Customer Not Found.', 'Number Not Found.', 'You have not received any code yet.', 'Customer Not Found.', 'Your balance is expired.', 'Error 102, check back later.'];

//             if (errors.includes(response.data)) {

//               console.log(response.data);
//               res.json('An error occurred while generating number try it again');
//             } else {

//               const smsFound = await smsSave.findOne({ phoneNumber }).exec()
//               smsFound.Activation_Code = response.data;
//               foundUser.walletBalance -= Number(matchingApp.rate) * 400
//               await smsFound.save()

//               res.json('successful')


//             }



//             // Save the updated document


//           } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "An unexpected error occurred." });
//           }

//         } else {
//           console.log('insufficent ');
//           res.status(500).json({ "message": " insufficent balance , fund your wallet " });
//         }

//       } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "An unexpected error occurred." });
//       }

//       return res.status(200).json({ message: "number as notexpired" })
//       // Attach user info for later use

//     } catch (err) {
//       if (err instanceof jwt.TokenExpiredError) {
//         console.log("Token has expired");
//         number_found.status = 'expired';
//         number_found.save()
//         console.log(number_found);

//         return res.status(403).json({ message: "Token expired" });
//       } else {
//         console.log("Error verifying token:", err.message);
//         return res.status(403).json({ message: "Invalid token" });
//       }
//     }
//     // try {

//     //   console.log(phoneNumber, country,app,'ddddd');
//     //   const response1 = await axios.get(`http://pvacodes.com/user/api/get_rates.php?country=${country}`);
//     //   const apps = response1.data

//     //   const matchingApp = apps.find(element => element.app === app);
//     //   console.log(matchingApp, 'ddddd');

//     //   if (Number(matchingApp.rate) * 400 < foundUser.walletBalance) {

//     //     if (!country || !app) { return res.status(400).json({ message: "Country and app are required." }); }
//     //     try {
//     //       const response = await axios.get(`http://pvacodes.com/user/api/get_sms.php`,
//     //         {
//     //           params: {
//     //             customer: process.env.PVACODE,
//     //             app: app,
//     //             number: phoneNumber,
//     //             country: country,

//     //           },
//     //         }
//     //       );
//     //       const errors = ['Customer Not Found.', 'Number Not Found.', 'You have not received any code yet.', 'Customer Not Found.', 'Your balance is expired.', 'Error 102, check back later.'];

//     //       if (errors.includes(response.data)) {

//     //         console.log(response.data);
//     //         res.json('An error occurred while generating number try it again');
//     //       } else {

//     //         const smsFound = await smsSave.findOne({ phoneNumber }).exec()
//     //         console.log(smsFound);
//     //         smsFound.Activation_Code = response.data;
//     //         foundUser.walletBalance -= Number(matchingApp.rate) * 400
//     //           await smsFound.save()

//     //         res.json('successful')


//     //       }



//     //       // Save the updated document


//     //     } catch (error) {
//     //       console.error(error);
//     //       return res.status(500).json({ message: "An unexpected error occurred." });
//     //     }

//     //   } else {
//     //     console.log('insufficent ');
//     //     res.status(500).json({ "message": " insufficent balance , fund your wallet " });
//     //   }

//     // } catch (error) {
//     //   console.error(error);
//     //   return res.status(500).json({ message: "An unexpected error occurred." });
//     // } 
//   }


// };




module.exports = { get_rates, generateNumber, showNumber, otp };
