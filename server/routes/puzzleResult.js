const express = require("express");

const PuzzleResult = require("../models/PuzzleResult");

const { protect, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// SAVE PUZZLE RESULT
// Patient only
// ========================================

router.post("/save", protect, patientOnly, async (req, res) => {
  try {
    const {
      level,
      rows,
      cols,
      puzzlePieces,
      attempts,
      mistakes,
      accuracy,
      responseTime,
      score,
      previousScore,
      difficultyChange,
    } = req.body;

    // Required fields check
    if (
      level === undefined ||
      rows === undefined ||
      cols === undefined ||
      puzzlePieces === undefined ||
      attempts === undefined ||
      mistakes === undefined ||
      accuracy === undefined ||
      responseTime === undefined ||
      score === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required puzzle data",
      });
    }

    const result = await PuzzleResult.create({
      // JWT se patient ki ID
      patientId: req.user.id,

      level,
      rows,
      cols,
      puzzlePieces,
      attempts,
      mistakes,
      accuracy,
      responseTime,
      score,
      previousScore: previousScore ?? 0,
      difficultyChange: difficultyChange ?? "SAME",
    });

    res.status(201).json({
      success: true,
      message: "Puzzle result saved successfully",
      result,
    });
  } catch (error) {
    console.error("Puzzle result save error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to save puzzle result",
    });
  }
});

module.exports = router;
