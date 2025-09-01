const { text } = require('express');
const nodemailer = require('nodemailer');




const notices = async (email, message, subject) => {
  

    const transporter = nodemailer.createTransport({
    host: process.env.HOSTEDEMAIL,
    port: process.env.PORTEMAIL,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.USEREMAIL,
      pass:  process.env.PASSEMAIL 
  
    }
  });
  try {
  await transporter.sendMail({
    from: "support@virex.codes",
    to:email,
    subject: subject,
   html: message
  });

  
  
} catch (error) {
    console.log('Error: ', error);
}
 
};
  module.exports = notices;