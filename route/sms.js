const express = require("express");
const router = express.Router();
const {get_rates, getCountries, generateNumber, showNumber, otp} = require("../controllers/sms");
const {rejectNumber} = require("../controllers/checkNumbers");
const verify = require("../controllers/verify");


router.get("/countries",   getCountries);
router.get("/apps/:country",  get_rates);

router.get("/numbers",  verify, showNumber);
router.post("/generateNumber", verify, generateNumber);
router.put("/otp/:Phone_Number",  otp);
router.post("/rejectNumber/:Phone_Number", verify, rejectNumber);

module.exports = router;
