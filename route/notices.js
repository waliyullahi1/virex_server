const express = require("express");
const router = express.Router();
const logoutController = require("../controllers/logOutControl");
const  notices = require("../controllers/emailSms");

router.post("/", async(req, res) => {
   const {email, message} = req.body;
    if (!email || !message) {
        return res.status(400).json({ error: "Amount and payment type are required" });
      }
      await notices(email, message);
      return res.status(200)
}

);

module.exports = router;
