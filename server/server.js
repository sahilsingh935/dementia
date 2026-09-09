const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const gameResultRoutes = require("./routes/gameResultRoutes");
const difficultyRoutes = require("./routes/difficulty");
const recallSequenceRoutes = require("./routes/recallSequence");

// Recall Sequence ML route
const recallSequenceDifficultyRoutes = require("./routes/recallSequenceDifficulty");

// Puzzle Result route
const puzzleResultRoutes = require("./routes/puzzleResult");

// Puzzle ML route
const puzzleDifficultyRoutes = require("./routes/puzzleDifficulty");

// Recognition Result route
const recognitionRoutes = require("./routes/recognition");

// Recognition ML route
const recognitionDifficultyRoutes = require("./routes/recognitionDifficulty");

// Routine Result route
const routineRoutes = require("./routes/routine");

// Routine ML route
const routineDifficultyRoutes = require("./routes/routineDifficulty");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ================================
// GAME RESULT ROUTES
// ================================

app.use("/api/game-results", gameResultRoutes);

// ================================
// MEMORY MATCH ML ROUTES
// ================================

app.use("/api/difficulty", difficultyRoutes);

// ================================
// RECALL SEQUENCE ROUTES
// ================================

app.use(
  "/api/recall-sequence",
  recallSequenceRoutes
);

// ================================
// RECALL SEQUENCE ML ROUTES
// ================================

app.use(
  "/api/recall-sequence/difficulty",
  recallSequenceDifficultyRoutes
);

// ================================
// PUZZLE GAME ROUTES
// ================================

app.use(
  "/api/puzzle",
  puzzleResultRoutes
);

// ================================
// PUZZLE ML ROUTES
// ================================

app.use(
  "/api/puzzle/difficulty",
  puzzleDifficultyRoutes
);

// ================================
// RECOGNITION GAME ROUTES
// ================================

app.use(
  "/api/recognition",
  recognitionRoutes
);

// ================================
// RECOGNITION ML ROUTES
// ================================

app.use(
  "/api/recognition/difficulty",
  recognitionDifficultyRoutes
);

// ================================
// ROUTINE GAME ROUTES
// ================================

app.use(
  "/api/routine",
  routineRoutes
);

// ================================
// ROUTINE ML ROUTES
// ================================

app.use(
  "/api/routine/difficulty",
  routineDifficultyRoutes
);

// ================================
// HOME ROUTE
// ================================

app.get("/", (req, res) => {
  res.json({
    message: "SmritiSetu Server is running",
  });
});

// ================================
// SERVER
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});