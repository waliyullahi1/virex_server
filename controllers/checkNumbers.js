const Sms = require('../model/sms');
const axios = require('axios');
const User = require("../model/Users");
const verifyNumber =require("../service/verify_Number") 
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

const checkNumbers = async () => {
  const now = new Date();

  // fetch all active numbers
  const activeNumbers = await Sms.find({ status: "ACTIVE" });
  console.log("Active numbers found:", activeNumbers.length);

  // Run all requests in parallel
  await Promise.all(
    activeNumbers.map(async (num) => {
      try {
        const smsResponse = await axios.get(
          `https://api.pvapins.com/user/api/get_sms.php?customer=${process.env.PVAPIN}&number=${num.Phone_Number}&country=${num.Country}&app=${num.App}`
        );

        // extract status string (handle both object + plain string)
        const statusMsg = smsResponse.data?.status || smsResponse.data || "";
        const normalizedMsg = String(statusMsg).trim().toLowerCase();

        const errors = [
          "customer not found.",
          "number not found.",
          "you have not received any code yet.",
          "your balance is expired.",
          "error 102, check back later."
        ];
  
        if (errors.some((e) => normalizedMsg.includes(e.toLowerCase())) || !smsResponse.data) {
          if (num.expireAt < now) {
            // refund user
            const user = await User.findOne({ email: num.email });
            if (user) {
              user.walletBalance += num.Amount;
              await user.save();
            }
            num.status = "REJECTED";
          }
        } else {
          // store activation code if provided
          num.Activation_Code = smsResponse.data;
          num.status = "USED";
        }

        await num.save();
      } catch (err) {
        console.error("Error checking number", num.Phone_Number, err.message);
      }
    })
  );
  

  const issuesNumber = await Sms.find({ status: "USED", Activation_Code: null });
console.log(issuesNumber);


await Promise.all(
  issuesNumber.map(async (num) => {
    try {
      const response = await axios.get(
        `https://api.pvapins.com/user/api/get_history.php?customer=${process.env.PVAPIN}`
      );

      console.log(response.data);

      // find number in API response
      const findNumber = Array.isArray(response.data)
        ? response.data.find((a) => a.number === num.Phone_Number)
        : null;

      // use either matched record or raw response
        num.Activation_Code = findNumber.message
      console.log(findNumber.message);
      

      await num.save();
    } catch (err) {
      console.error("Error checking number", num.Phone_Number, err.message);
    }
  })
);


};


const rejectNumber = async (req, res) => {
  lock.acquire('reject-lock', async (done) => {
    try {



      const cookies = req.cookies;
      if (!cookies?.jwt) return res.status(401);
      const refreshToken = cookies.jwt;
      const user = await User.findOne({ refreshToken }).exec();
      const { Phone_Number } = req.params;
      console.log(Phone_Number);
      
      if (!Phone_Number) return res.status(403).json({ message: "Phone number required" }); //Forbidden
      const num = await Sms.findOne({ Phone_Number }).exec();
      if (!num) return res.status(404).json({ message: "Number not found" }); //Not Found

      const verify_Number = await verifyNumber(Phone_Number)
      console.log(verify_Number, ' fetch app finished');
      if (verify_Number.status === "ACTIVE") {
        const response = await axios.get(`https://api.pvapins.com/user/api/get_reject_number.php?customer=${process.env.PVAPIN}&number=${verify_Number.Phone_Number}&country=${verify_Number.Country}&app=${verify_Number.App}`);
        console.log(response.data, ' fetch app finished');
        num.status = "REJECTED";
        if (user) {
          user.walletBalance += num.Amount;
          await user.save();
        }
        await num.save();
        return res.status(200).json({ message: response.data });

      }

    }  finally {
      done(); // Release the lock
    }
  }, (err) => {
    if (err) {
      console.error("Lock error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

module.exports = { checkNumbers, rejectNumber };
