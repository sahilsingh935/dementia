const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

router.post("/predict", (req, res) => {
  const {
    sequence_length,
    accuracy,
    response_time,
    total_attempts,
    mistakes,
    previous_score,
    current_level,
  } = req.body;

  // ================================
  // VALIDATION
  // ================================

  if (
    sequence_length === undefined ||
    accuracy === undefined ||
    response_time === undefined ||
    total_attempts === undefined ||
    mistakes === undefined ||
    previous_score === undefined ||
    current_level === undefined
  ) {
    return res.status(400).json({
      error: "Missing required ML input",
    });
  }

  // ================================
  // PYTHON SCRIPT
  // ================================

  const pythonScript = path.join(
    __dirname,
    "../../ml/predict_recall_sequence.py",
  );

  // ================================
  // RUN PYTHON ML MODEL
  // ================================

  const python = spawn("python", [
    pythonScript,
    sequence_length,
    accuracy,
    response_time,
    total_attempts,
    mistakes,
    previous_score,
    current_level,
  ]);

  let result = "";
  let error = "";

  // Python output
  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  // Python error
  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  // ================================
  // PYTHON COMPLETED
  // ================================

  python.on("close", (code) => {
    if (code !== 0) {
      console.error("Recall Sequence ML error:", error);

      return res.status(500).json({
        error: "Recall Sequence ML prediction failed",
      });
    }

    const prediction = result.trim();

    console.log("Recall Sequence ML Prediction:", prediction);

    res.json({
      success: true,
      difficulty_change: prediction,
    });
  });
});

module.exports = router;
