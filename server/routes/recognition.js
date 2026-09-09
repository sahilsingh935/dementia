const express = require("express");

const RecognitionResult = require("../models/RecognitionResult");

const { protect, patientOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// SAVE RECOGNITION RESULT
// ========================================

router.post("/save", protect, patientOnly, async (req, res) => {
  try {
    const data = req.body;

    const result = await RecognitionResult.create({
      // JWT se patient ID
      patientId: req.user.id,

      // ========================================
      // GAME
      // ========================================
      gameType: "recognition",

      level: data.currentLevel ?? 1,

      // ========================================
      // QUESTIONS
      // ========================================
      totalQuestions: data.totalQuestions,

      totalAttempts: data.totalAttempts,

      correctAttempts: data.correctAttempts,

      mistakes: data.mistakes,

      // ========================================
      // PERFORMANCE
      // ========================================
      accuracy: data.accuracy,

      score: data.score ?? 0,

      responseTime: data.responseTime,

      // ========================================
      // QUESTION DETAILS
      // ========================================
      questionAttempts: data.questionAttempts,

      // ========================================
      // ML / DIFFICULTY
      // ========================================
      previousScore: data.previousScore ?? 0,

      difficultyScore: data.difficultyScore ?? 0,

      difficultyChange: data.difficultyChange ?? "SAME",

      // ========================================
      // STATUS
      // ========================================
      completed: data.completed ?? true,

      playedAt: data.playedAt ? new Date(data.playedAt) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Recognition result saved successfully",
      resultId: result._id,
    });
  } catch (error) {
    console.error("Recognition save error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to save recognition result",
    });
  }
});

module.exports = router;
