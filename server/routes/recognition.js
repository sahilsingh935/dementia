const express = require("express");

const RecognitionResult = require("../models/RecognitionResult");

const router = express.Router();

// --------------------------------
// SAVE RECOGNITION RESULT
// --------------------------------

router.post("/save", async (req, res) => {
  try {
    const data = req.body;

    const result = await RecognitionResult.create({
      gameType: "recognition",

      totalQuestions: data.totalQuestions,

      totalAttempts: data.totalAttempts,

      correctAttempts: data.correctAttempts,

      mistakes: data.mistakes,

      accuracy: data.accuracy,

      responseTime: data.responseTime,

      questionAttempts: data.questionAttempts,

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
