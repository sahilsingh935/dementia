const express = require("express");
const RoutineResult = require("../models/RoutineResult");

const { protect, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/*
  =========================
  SAVE ROUTINE GAME RESULT
  =========================
*/

router.post("/results", protect, patientOnly, async (req, res) => {
  try {
    const result = new RoutineResult({
      // JWT se logged-in patient ki ID
      patientId: req.user.id,

      gameType: "routine",

      level: req.body.level || 1,

      totalQuestions: req.body.totalQuestions,

      totalAttempts: req.body.totalAttempts,

      correctAttempts: req.body.correctAttempts,

      mistakes: req.body.mistakes,

      score: req.body.score,

      accuracy: req.body.accuracy,

      responseTime: req.body.responseTime,

      currentDifficulty: req.body.currentDifficulty || "easy",

      difficultyChange: req.body.difficultyChange || "SAME",

      previousScore: req.body.previousScore || 0,

      playedAt: req.body.playedAt || new Date(),
    });

    const savedResult = await result.save();

    res.status(201).json({
      success: true,
      message: "Routine result saved successfully",
      result: savedResult,
    });
  } catch (error) {
    console.error("Routine result save error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to save Routine result",
    });
  }
});

/*
  =========================
  GET ROUTINE RESULTS
  =========================

  Public GET hata diya hai.
  Caretaker ke liye baad mein
  protected analytics endpoint banega.
  =========================
*/

module.exports = router;
