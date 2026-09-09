const express = require("express");

const { getCaretakerAnalytics } = require("../controllers/caretakerController");

const { protect, caretakerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// GET CARETAKER ANALYTICS
// ========================================

router.get("/analytics", protect, caretakerOnly, getCaretakerAnalytics);

module.exports = router;
