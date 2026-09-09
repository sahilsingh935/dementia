const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

/*
  =========================
  ROUTINE ML PREDICTION
  =========================
*/

router.post("/predict", (req, res) => {
  const {
    current_difficulty,
    accuracy,
    response_time,
    total_attempts,
    mistakes,
    score,
    previous_score,
  } = req.body;

  // =========================
  // BASIC VALIDATION
  // =========================

  if (
    current_difficulty === undefined ||
    accuracy === undefined ||
    response_time === undefined ||
    total_attempts === undefined ||
    mistakes === undefined ||
    score === undefined ||
    previous_score === undefined
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required Routine ML fields",
    });
  }

  // =========================
  // PYTHON SCRIPT PATH
  // =========================

  const pythonScript = path.join(
    __dirname,
    "../../ml/predict_routine.py"
  );

  // =========================
  // RUN PYTHON ML MODEL
  // =========================

  const python = spawn("python", [
    pythonScript,
    current_difficulty,
    accuracy,
    response_time,
    total_attempts,
    mistakes,
    score,
    previous_score,
  ]);

  let result = "";
  let error = "";

  // =========================
  // PYTHON OUTPUT
  // =========================

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  // =========================
  // PYTHON ERROR
  // =========================

  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  // =========================
  // PROCESS COMPLETE
  // =========================

  python.on("close", (code) => {
    if (code !== 0) {
      console.error(
        "Routine ML error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Routine ML prediction failed",
      });
    }

    const prediction =
      result.trim();

    console.log(
      "Routine ML prediction:",
      prediction
    );

    res.json({
      success: true,
      difficulty_change: prediction,
    });
  });
});

module.exports = router;