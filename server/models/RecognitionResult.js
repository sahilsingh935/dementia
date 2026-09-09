const mongoose = require("mongoose");

const recognitionResultSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      default: "recognition",
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

    accuracy: {
      type: Number,
      required: true,
    },

    responseTime: {
      type: Number,
      required: true,
    },

    questionAttempts: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    completed: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("RecognitionResult", recognitionResultSchema);
