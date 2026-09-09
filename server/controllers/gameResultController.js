const GameResult = require("../models/GameResult");

const createGameResult = async (req, res) => {
  try {
    const gameResult = await GameResult.create(req.body);

    res.status(201).json({
      success: true,
      message: "Game result saved successfully",
      data: gameResult,
    });
  } catch (error) {
    console.error("Error saving game result:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save game result",
    });
  }
};

module.exports = {
  createGameResult,
};
