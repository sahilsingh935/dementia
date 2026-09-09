const mongoose = require("mongoose");

const puzzleResultSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      default: "puzzle",
    },

    level: {
      type: Number,
      required: true,
    },

    rows: {
      type: Number,
      required: true,
    },

    cols: {
      type: Number,
      required: true,
    },

    puzzlePieces: {
      type: Number,
      required: true,
    },

    attempts: {
      type: Number,
      required: true,
    },

    mistakes: {
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

    score: {
      type: Number,
      required: true,
    },

    previousScore: {
      type: Number,
      default: 0,
    },

    difficultyChange: {
      type: String,
      enum: ["HARDER", "SAME", "EASIER"],
      default: "SAME",
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

module.exports = mongoose.model("PuzzleResult", puzzleResultSchema);
