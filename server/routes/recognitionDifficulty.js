const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

router.post("/predict", (req, res) => {
  const {
    current_level,
    accuracy,
    response_time,
    total_attempts,
    mistakes,
    previous_score,
    hint_used,
    difficulty_score,
  } = req.body;

  // ==================================
  // PYTHON SCRIPT
  // ==================================

  const pythonScript = path.join(__dirname, "../../ml/predict_recognition.py");

  // ==================================
  // RUN PYTHON
  // ==================================

  const python = spawn("python", [
    pythonScript,

    current_level,
    accuracy,
    response_time,
    total_attempts,
    mistakes,
    previous_score,
    hint_used,
    difficulty_score,
  ]);

  let result = "";
  let error = "";

  // ==================================
  // PYTHON OUTPUT
  // ==================================

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  // ==================================
  // PYTHON ERROR
  // ==================================

  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  // ==================================
  // PROCESS COMPLETE
  // ==================================

  python.on("close", (code) => {
    if (code !== 0) {
      console.error("Recognition ML error:", error);

      return res.status(500).json({
        success: false,
        error: "Recognition ML prediction failed",
      });
    }

    res.json({
      success: true,
      difficulty_change: result.trim(),
    });
  });
});

module.exports = router;
