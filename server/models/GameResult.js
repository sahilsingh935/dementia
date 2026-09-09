const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema(
  {
    // ========================================
    // PATIENT WHO PLAYED THE GAME
    // ========================================
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // GAME INFO
    // ========================================
    game: {
      type: String,
      required: true,
      default: "memory",
    },

    state: {
      type: String,
      required: true,
    },

    level: {
      type: Number,
      required: true,
    },

    // ========================================
    // BASIC PERFORMANCE
    // ========================================
    moves: {
      type: Number,
      required: true,
    },

    seconds: {
      type: Number,
      required: true,
    },

    accuracy: {
      type: Number,
      default: 0,
    },

    mistakes: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    // ========================================
    // MEMORY GAME ATTEMPTS
    // ========================================
    totalAttempts: {
      type: Number,
      default: 0,
    },

    laterAttempts: {
      type: Number,
      default: 0,
    },

    laterMistakes: {
      type: Number,
      default: 0,
    },

    // ========================================
    // ML DIFFICULTY DECISION
    // ========================================
    difficultyChange: {
      type: String,
      default: null,
    },

    // ========================================
    // GAME STATUS
    // ========================================
    completed: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // GAME CREATED TIME
    // ========================================
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("GameResult", gameResultSchema);
