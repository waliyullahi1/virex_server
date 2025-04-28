const nodemailer = require('nodemailer');




const notices = async (email, message) => {
  let pinHtml = ` ${message}`
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'waliuwaheed2021@gmail.com', 
      pass: process.env.EMAIL_PASSkEY
    }
  });

  let mailOptions = {
    from: '"no-reply"info@abaniseedu.com', 
    to: email, 
    subject: 'Notices', 
   
    html: pinHtml
   };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
} catch (error) {
    console.log('Error: ', error);
}
 
};
  module.exports = notices;