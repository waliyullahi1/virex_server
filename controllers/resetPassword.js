
const nodemailer = require('nodemailer');
const User = require('../model/Users');
const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');





const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser) {
      return res.status(400).json({ message: "Email does not exist" });
    }

   
    const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the random password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

   
    foundUser.password = hashedPassword;
    await foundUser.save();


    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'waliuwaheed2021@gmail.com',
        pass: 'onxr sqvu qtwa eblk'
      }
    });

    let mailOptions = {
      from: '"Abaniseedu" <waliuwaheed2021@gmail.com>',
      to: email,
      subject: 'Forget Password - Abaniseedu.com',
      text: `Dear ${foundUser.email},\nYour new password: ${randomPassword}\nThanks`,
    };
    

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      }
      return res.status(200).json({ sucess: " A new password has sent to your email.  " });
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



const resetPassword = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(402);
  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken }).exec();

  if (!foundUser) return res.sendStatus(403);

  const { currentpassword, newPassword } = req.body;


  if (foundUser) {
    const isOldPasswordCorrect = await bcrypt.compare(currentpassword, foundUser.password);
    if (!isOldPasswordCorrect) return res.status(401).json({ message: "Incorrect old password" });

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    foundUser.password = hashedPwd


    await foundUser.save()
    console.log(foundUser.password)
    return res.json({ success: "passwords reset sucesssful" })
  } else {
    return res
      .status(400)
      .json({ message: "usermane and password are require" });
  }
};

const resetTransactionCode = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const refreshToken = cookies.jwt;
    const foundUser = await User.findOne({ refreshToken }).exec();

    if (!foundUser) {
      return res.status(403).json({ message: "User not found" });
    }

    const { newTransactionCode } = req.body;
    if (!newTransactionCode) {
      return res.status(400).json({ message: "Transaction code is required" });
    }

    if (newTransactionCode.length !== 4) {
      return res.status(400).json({ message: "Transaction code must be 4 digits" });
    }

    foundUser.transaction = newTransactionCode;
    await foundUser.save();

    console.log("Transaction code updated:", foundUser.email);
    return res.json({ message: "Transaction code reset successful" });
  } catch (error) {
    console.error("Error resetting transaction code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { requestPasswordReset, resetPassword, resetTransactionCode }
