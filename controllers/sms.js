const User = require("../model/Users");
const Sms = require('../model/sms');
const axios = require('axios');
const smsSaves = require('./savesms');
const AsyncLock = require('async-lock');
const jwt = require("jsonwebtoken");
const lock = new AsyncLock();
const verifyNumber =require("../service/verify_Number") 
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

// 📌 uploads function (no UUID, just name)
const uploads = (fileBuffer, originalName, customFolder = "general") => {
  return new Promise((resolve, reject) => {
    try {
      const baseUploadPath = path.join(process.cwd(), "uploads", customFolder);

      if (!fs.existsSync(baseUploadPath)) {
        fs.mkdirSync(baseUploadPath, { recursive: true });
      }

      // ✅ Just use the original name (replace spaces with _)
      const uniqueName = originalName.replace(/\s+/g, "_");
      const fullPath = path.join(baseUploadPath, uniqueName);

      fs.writeFile(fullPath, fileBuffer, (err) => {
        if (err) return reject(err);

        const relativePath = `/uploads/${customFolder}/${uniqueName}`.replace(/\\/g, "/");

        const mimeType = mime.lookup(originalName);
        const fileExtension = path.extname(originalName);

        let fileType = "other";
        if (mimeType?.startsWith("image/")) fileType = "image";
        else if (mimeType?.startsWith("video/")) fileType = "video";
        else if (mimeType === "application/pdf") fileType = "pdf";

        resolve({
          path: relativePath,
          type: fileType,
          extension: fileExtension || "",
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

// 📌 Download and save by full name
async function downloadAndSave(url, fullName, customFolder = "countries") {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Get extension from URL
    const fileExtension = path.extname(url) || ".webp";

    // File name = full name + extension
    const safeName = fullName.replace(/\s+/g, "_");
    const originalName = `${safeName}${fileExtension}`;

    const savedFile = await uploads(response.data, originalName, customFolder);

    console.log("✅ Saved:", savedFile.path);
    return savedFile;
  } catch (err) {
    console.error("❌ Error downloading:", err.message);
  }
}

// 📌 Controller function (CommonJS export)
const getCountries = async (req, res) => {
  try {
    const response = await axios.get(`https://api.pvapins.com/user/api/load_countries.php`);
    const countries = response.data;


    return res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching rates:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data || "Error from external API",
        status: error.response.status,
      });
    } else if (error.request) {
      return res.status(502).json({ message: "No response from external server" });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};



const get_rates = async (req, res) => {
  const country = req.query.country || req.params.country;

  if (!country) {
    return res.status(400).json({ message: "Country is required" });
  }

  try {


    // Use cloudscraper to bypass Cloudflare and get response as text

    const response = await axios.get(`https://api.pvapins.com/user/api/load_apps.php?country_id=${country}`);

   
    return res.status(200).json(response.data);

  } catch (error) {
    console.error("Error fetching rates:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data || "Error from external API",
        status: error.response.status,
      });
    } else if (error.request) {
      return res.status(502).json({ message: "No response from external server" });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};



const convertToNaira = async () => {
  try {


    // Example using ExchangeRate API (replace with your own API key)
    const res = await axios.get(
      "https://open.er-api.com/v6/latest/USD"  // free API for USD rates
    );

    // Get NGN conversion rate
    const value = res.data.rates.NGN + 420;

    // Convert amount

    return value;

  } catch (err) {
    console.error("Error fetching rate:", err.message);
  }
}




const generateNumber = async (req, res) => {
  lock.acquire('generateNumber_lock', async (done) => {
    try {

      const cookies = req.cookies;
      if (!cookies?.jwt) return res.sendStatus(401);
      const refreshToken = cookies.jwt;


      const foundUser = await User.findOne({ refreshToken }).exec();
      if (foundUser) {
        const { country, app, country_code } = req.body;
        console.log(country, app, country_code);
        if (!country || !app || !country_code) { return res.status(400).json({ message: "Country, app, and country_code are required." }); }


        try {
          console.log('try to fetch app');
          const response1 = await axios.get(`https://api.pvapins.com/user/api/load_apps.php?country_id=${country_code}`);
          console.log(' fetch app finished');
          const apps = response1.data

          const matchingApp = apps.find(element => element.full_name === app);
        

          

          if (!matchingApp) return res.status(404).json({ message: "App not found" });
          const usdToNgn = await convertToNaira();

          const price = Number(matchingApp.deduct) * usdToNgn


          if (price.toFixed(1) < foundUser.walletBalance) {

            try {
              console.log('try to generate number');
              //https://api.pvapins.com/user/api/get_number.php?customer=apikey&app=appname&country=countryname
              const response = await axios.get(`https://api.pvapins.com/user/api/get_number.php?customer=${process.env.PVAPIN}&app=${app}&country=${country}`);
              const errors = ['App Not Found.', 'No free channels available check after sometime.', 'Not Enough balance', 'Customer Not Found.', 'New Numbers registration in progress, please wait or check back later.', 'Error 102, check back later.'];
              console.log(response);
              console.log(' generate number finished');
              const expireTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

              if (errors.includes(response.data)) {
                console.log(response.data, 'error is the matter');
                res.status(200).json(response.data);
                } else {
                  foundUser.walletBalance -= Number(price.toFixed(1));
                  foundUser.save();
                  const savesms = await Sms.create({
                    email: foundUser.email,
                    new_bal: foundUser.walletBalance,
                  transactiondate: new Date(),
                  expireAt: expireTime,
                  Phone_Number: response.data,
                  Country: country,
                  App: matchingApp.full_name,
                  Amount: price.toFixed(1),
                  status: "ACTIVE"
                });


            
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



    } finally {
      done(); // Release the lock
    }
  }, (err) => {
    if (err) {
      console.error("Lock error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });



  // Acknowledge receipt
}



const showNumber = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken }).sort({ createdAt: -1 }).exec();
  if (!foundUser) return res.status(402).json({ "message": 'user not found' })
  const email = foundUser.email;

  const sms = await Sms.find({ email }).sort({ transactiondate: -1 });

  res.json(sms);
}







const otp = async (req, res) => {
  lock.acquire('otp-lock', async (done) => {
    try {

      const cookies = req.cookies;
      if (!cookies?.jwt) return res.sendStatus(401);

      const refreshToken = cookies.jwt;
      const foundUser = await User.findOne({ refreshToken }).exec();
      if (!foundUser) return res.sendStatus(403);  // Handle missing user
      console.log('try to verify number');
      const {  Phone_Number } = req.params
      console.log(Phone_Number);
       const verify_Number = await verifyNumber(Phone_Number)
         console.log(verify_Number, 'verify_Number verify number finished');
        res.status(200).json({success:"number update successful"})
    } finally {
      done(); // Release the lock
    }
  }, (err) => {
    if (err) {
      console.error("Lock error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });



  // Acknowledge receipt
}






module.exports = { get_rates, getCountries, generateNumber, showNumber, otp };
