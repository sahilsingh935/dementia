const express = require("express");

const {
  createGameResult,
} = require("../controllers/gameResultController");

const router = express.Router();

router.post("/", createGameResult);

module.exports = router;