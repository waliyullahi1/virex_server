const express = require("express");
const router = express.Router();
const {get_rates, generateNumber, showNumber, otp} = require("../controllers/sms");
const verify = require("../controllers/verify");

router.get("/apps/:country",  get_rates);
router.get("/",   showNumber);
router.post("/generateNumber",  generateNumber);
router.put("/otp",  otp);

module.exports = router;
