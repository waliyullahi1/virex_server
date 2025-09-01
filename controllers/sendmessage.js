const bcrypt = require('bcryptjs');
const notices = require("./emailSms");
const backOnlineTemplate = require("../template/backonline");
const User = require("../model/Users");

const sendsorrymessage = async () => {
  try {
    const allUsers = await User.find({}); // Await the DB query

    // Run all requests in parallel
    await Promise.all(
      allUsers.map(async (user) => {
        try {
          await notices(
            user.email,
            backOnlineTemplate(), 
            'Virex.Codes is Fully Restored & Better Than Ever!'
          );
          console.log('Email has been sent to', user.email);
        } catch (err) {
          console.error(`Error sending email to ${user.email}:`, err.message);
        }
      })
    );
  } catch (err) {
    console.error("Error fetching users:", err.message);
  }
};

module.exports = sendsorrymessage;
