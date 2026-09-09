const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

router.post("/predict", (req, res) => {
  const {
    puzzle_pieces,
    accuracy,
    response_time,
    attempts,
    mistakes,
    previous_score,
    current_level,
  } = req.body;

  // -----------------------------------------
  // Validate input
  // -----------------------------------------

  if (
    puzzle_pieces === undefined ||
    accuracy === undefined ||
    response_time === undefined ||
    attempts === undefined ||
    mistakes === undefined ||
    previous_score === undefined ||
    current_level === undefined
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required puzzle data",
    });
  }

  // -----------------------------------------
  // Python prediction script
  // -----------------------------------------

  const pythonScript = path.join(__dirname, "../../ml/predict_puzzle.py");

  // -----------------------------------------
  // Run Python
  // -----------------------------------------

  const python = spawn("python", [
    pythonScript,
    puzzle_pieces,
    accuracy,
    response_time,
    attempts,
    mistakes,
    previous_score,
    current_level,
  ]);

  let result = "";
  let error = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  // -----------------------------------------
  // Python finished
  // -----------------------------------------

  python.on("close", (code) => {
    if (code !== 0) {
      console.error("Puzzle ML error:", error);

      return res.status(500).json({
        success: false,
        error: "Puzzle ML prediction failed",
      });
    }

    const prediction = result.trim();

    console.log("Puzzle ML Prediction:", prediction);

    res.json({
      success: true,
      difficulty_change: prediction,
    });
  });
});

module.exports = router;
