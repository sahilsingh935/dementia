const express = require("express");

const PuzzleResult = require("../models/PuzzleResult");

const router = express.Router();

router.post("/save", async (req, res) => {
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
