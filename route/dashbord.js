const express = require("express");
const router = express.Router();
const dashboard = require("../controllers/dashboard");
const verify = require("../controllers/verify");
const saveCode = require("../controllers/test");
router.get("/", verify, dashboard);
router.get("/dd",saveCode);

module.exports = router;
