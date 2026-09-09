const mongoose = require("mongoose");

const recognitionResultSchema = new mongoose.Schema(
  {
    // ========================================
    // PATIENT WHO PLAYED
    // ========================================
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // GAME
    // ========================================
    gameType: {
      type: String,
      default: "recognition",
    },

    level: {
      type: Number,
      default: 1,
    },

    // ========================================
    // QUESTIONS
    // ========================================
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

    // ========================================
    // PERFORMANCE
    // ========================================
    accuracy: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    responseTime: {
      type: Number,
      required: true,
    },

    // ========================================
    // QUESTION DETAILS
    // ========================================
    questionAttempts: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // ========================================
    // ML / DIFFICULTY
    // ========================================
    previousScore: {
      type: Number,
      default: 0,
    },

    difficultyScore: {
      type: Number,
      default: 0,
    },

    difficultyChange: {
      type: String,
      default: "SAME",
    },

    // ========================================
    // STATUS
    // ========================================
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
