const express = require("express");

const { createGameResult } = require("../controllers/gameResultController");

const { protect, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, patientOnly, createGameResult);

module.exports = router;
