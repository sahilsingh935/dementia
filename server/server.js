require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// ===============================
// EXISTING GAME ROUTES
// ===============================

const gameResultRoutes = require("./routes/gameResultRoutes");
const difficultyRoutes = require("./routes/difficulty");

const puzzleResultRoutes = require("./routes/puzzleResult");
const puzzleDifficultyRoutes = require("./routes/puzzleDifficulty");

const recallSequenceRoutes = require("./routes/recallSequence");
const recallSequenceDifficultyRoutes = require("./routes/recallSequenceDifficulty");

const recognitionRoutes = require("./routes/recognition");
const recognitionDifficultyRoutes = require("./routes/recognitionDifficulty");

const routineRoutes = require("./routes/routine");
const routineDifficultyRoutes = require("./routes/routineDifficulty");

// ===============================
// AUTH ROUTES
// ===============================

const authRoutes = require("./routes/authRoutes");

// ===============================
// CARETAKER ROUTES
// ===============================

const caretakerRoutes = require("./routes/caretakerRoutes");

const app = express();

// ===============================
// DATABASE
// ===============================

connectDB();

// ===============================
// MIDDLEWARE
// ===============================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

app.use(express.json());

// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "MANAS backend is running",
  });
});

// ===============================
// AUTH
// ===============================

app.use("/api/auth", authRoutes);

// ===============================
// CARETAKER
// ===============================

app.use("/api/caretaker", caretakerRoutes);

// ===============================
// EXISTING GAME APIs
// ===============================

app.use("/api/game-results", gameResultRoutes);

app.use("/api/difficulty", difficultyRoutes);

app.use("/api/puzzle", puzzleResultRoutes);

app.use("/api/puzzle/difficulty", puzzleDifficultyRoutes);

app.use("/api/recall-sequence", recallSequenceRoutes);

app.use("/api/recall-sequence/difficulty", recallSequenceDifficultyRoutes);

app.use("/api/recognition", recognitionRoutes);

app.use("/api/recognition/difficulty", recognitionDifficultyRoutes);

app.use("/api/routine", routineRoutes);

app.use("/api/routine/difficulty", routineDifficultyRoutes);

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Internal server error",
  });
});

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MANAS backend running on port ${PORT}`);
});
