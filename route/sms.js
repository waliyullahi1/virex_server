const express = require("express");
const router = express.Router();
const {get_rates, generateNumber, showNumber, otp} = require("../controllers/sms");
const verify = require("../controllers/verify");

router.get("/apps/:country",  get_rates);
router.get("/",  verify, showNumber);
router.post("/generateNumber", verify,  generateNumber);
router.put("/otp",  otp);

module.exports = router;
