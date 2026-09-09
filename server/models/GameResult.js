const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema(
  {
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

    moves: {
      type: Number,
      required: true,
    },

    seconds: {
      type: Number,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

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
