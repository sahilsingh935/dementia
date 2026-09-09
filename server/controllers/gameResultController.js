const GameResult = require("../models/GameResult");

// ======================================
// CREATE GAME RESULT
// ======================================

const createGameResult = async (req, res) => {
  try {
    // --------------------------------------
    // AUTH CHECK
    // --------------------------------------

    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can save game results",
      });
    }

    // --------------------------------------
    // CREATE RESULT
    // --------------------------------------

    const gameResult = await GameResult.create({
      // IMPORTANT:
      // Patient ID JWT se li jayegi.
      // Frontend se patientId accept nahi karni.
      patientId: req.user.id,

      // --------------------------------------
      // GAME DATA
      // --------------------------------------

      game: req.body.game,
      state: req.body.state,
      level: req.body.level,

      // --------------------------------------
      // BASIC PERFORMANCE
      // --------------------------------------

      moves: req.body.moves,
      seconds: req.body.seconds,

      accuracy: req.body.accuracy ?? 0,
      mistakes: req.body.mistakes ?? 0,
      score: req.body.score ?? 0,

      // --------------------------------------
      // ATTEMPTS
      // --------------------------------------

      totalAttempts: req.body.totalAttempts ?? 0,
      laterAttempts: req.body.laterAttempts ?? 0,
      laterMistakes: req.body.laterMistakes ?? 0,

      // --------------------------------------
      // ML DIFFICULTY
      // --------------------------------------

      difficultyChange: req.body.difficultyChange ?? null,

      // --------------------------------------
      // COMPLETION
      // --------------------------------------

      completed: req.body.completed ?? false,
    });

    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    return res.status(201).json({
      success: true,
      message: "Game result saved successfully",
      data: gameResult,
    });
  } catch (error) {
    console.error("Error saving game result:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save game result",
    });
  }
};

module.exports = {
  createGameResult,
};
