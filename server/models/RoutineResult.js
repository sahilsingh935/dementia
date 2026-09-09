const mongoose = require("mongoose");

const routineResultSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      default: "routine",
      required: true,
    },

    level: {
      type: Number,
      default: 1,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    totalAttempts: {
      type: Number,
      required: true,
    },

    correctAttempts: {
      type: Number,
      required: true,
    },

    mistakes: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    accuracy: {
      type: Number,
      required: true,
    },

    responseTime: {
      type: Number,
      required: true,
    },

    currentDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    difficultyChange: {
      type: String,
      enum: ["EASIER", "SAME", "HARDER"],
      default: "SAME",
    },

    previousScore: {
      type: Number,
      default: 0,
    },

    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("RoutineResult", routineResultSchema);
