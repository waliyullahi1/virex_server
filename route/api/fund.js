
const express = require("express");
const router = express.Router();
const fund = require("../../controllers/fund")
const fundHistory = require("../../controllers/fundHistory")

router.post("/", fund.Fund_wallet_by_transfer);
router.post("/web", fund.webhook);
router.post("/valid", fund.valid_transaction);
router.get("/history", fundHistory);
router.post("/card", fund.fund_wallet_by_card); 
module.exports = router;
