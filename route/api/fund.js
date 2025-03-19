
const express = require("express");
const router = express.Router();
const fund = require("../../controllers/fund")

router.post("/", fund.Fund_wallet_by_transfer);
router.post("/web", fund.webhook);

module.exports = router;
