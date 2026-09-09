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
    later_attempts,
    later_mistakes,
    previous_score,
  } = req.body;

  const pythonScript = path.join(__dirname, "../../ml/predict_api.py");

  const python = spawn("python", [
    pythonScript,

    current_level,
    accuracy,
    response_time,
    total_attempts,
    later_attempts,
    later_mistakes,
    previous_score,
  ]);

  let result = "";
  let error = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (data) => {
    error += data.toString();
  });

  python.on("close", (code) => {
    if (code !== 0) {
      console.error("Python error:", error);

      return res.status(500).json({
        error: "ML prediction failed",
      });
    }

    res.json({
      difficulty_change: result.trim(),
    });
  });
});

module.exports = router;
