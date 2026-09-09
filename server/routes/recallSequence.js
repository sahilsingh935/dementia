const express = require("express");

const RecallSequenceResult = require("../models/RecallSequenceResult");

const { protect, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// SAVE RECALL SEQUENCE RESULT
// Patient only
// ========================================

router.post("/save", protect, patientOnly, async (req, res) => {
  try {
    const {
      level,
      sequenceLength,
      totalAttempts,
      correctAttempts,
      mistakes,
      accuracy,
      responseTime,
      score,
      difficultyChange,
    } = req.body;

    const result = await RecallSequenceResult.create({
      // JWT se logged-in patient ki ID
      patientId: req.user.id,

      gameType: "recall_sequence",
      level,
      sequenceLength,
      totalAttempts,
      correctAttempts,
      mistakes,
      accuracy,
      responseTime,
      score,
      difficultyChange: difficultyChange || "SAME",
    });

    res.status(201).json({
      success: true,
      message: "Recall Sequence result saved",
      data: result,
    });
  } catch (error) {
    console.error("Recall Sequence save error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save Recall Sequence result",
    });
  }
});

// ========================================
// GET RECALL SEQUENCE RESULTS
// ========================================
//
// Abhi public GET hata rahe hain.
// Caretaker ke liye baad mein dedicated
// protected analytics endpoint banega.
//
// ========================================

module.exports = router;
