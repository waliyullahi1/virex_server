const express = require("express");
const router = express.Router();
const handleRefreshToken = require("../controllers/refreshTokenControl");

router.get("/",  handleRefreshToken);

module.exports = router;
