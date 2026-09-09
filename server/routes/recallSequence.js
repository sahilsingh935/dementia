const express = require("express");

const RecallSequenceResult = require("../models/RecallSequenceResult");

const router = express.Router();

// SAVE RECALL SEQUENCE RESULT
router.post("/save", async (req, res) => {
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

// GET ALL RECALL SEQUENCE RESULTS
router.get("/", async (req, res) => {
  try {
    const results = await RecallSequenceResult.find().sort({ playedAt: -1 });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Recall Sequence fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch Recall Sequence results",
    });
  }
});

module.exports = router;
