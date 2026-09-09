const mongoose = require("mongoose");

const recallSequenceResultSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      default: "recall_sequence",
    },

    level: {
      type: Number,
      required: true,
    },

    sequenceLength: {
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

    difficultyChange: {
      type: String,
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

module.exports = mongoose.model(
  "RecallSequenceResult",
  recallSequenceResultSchema,
);
