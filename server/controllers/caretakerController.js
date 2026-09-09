const User = require("../models/User");

const GameResult = require("../models/GameResult");
const PuzzleResult = require("../models/PuzzleResult");
const RecallSequenceResult = require("../models/RecallSequenceResult");
const RecognitionResult = require("../models/RecognitionResult");
const RoutineResult = require("../models/RoutineResult");

// ========================================
// GET CARETAKER ANALYTICS
// ========================================

const getCaretakerAnalytics = async (req, res) => {
  try {
    // Logged-in caretaker ki ID JWT se
    const caretakerId = req.user.id;

    // Sirf isi caretaker ke patients
    const patients = await User.find({
      role: "patient",
      createdBy: caretakerId,
    }).select("-password");

    // Patient IDs
    const patientIds = patients.map((patient) => patient._id);

    // Agar caretaker ke koi patients nahi hain
    if (patientIds.length === 0) {
      return res.status(200).json({
        success: true,
        patients: [],
        analytics: {
          memory: [],
          puzzle: [],
          recallSequence: [],
          recognition: [],
          routine: [],
        },
      });
    }

    // ========================================
    // FETCH ALL GAME RESULTS
    // ========================================

    const [
      memoryResults,
      puzzleResults,
      recallSequenceResults,
      recognitionResults,
      routineResults,
    ] = await Promise.all([
      GameResult.find({
        patientId: { $in: patientIds },
      }).sort({ createdAt: -1 }),

      PuzzleResult.find({
        patientId: { $in: patientIds },
      }).sort({ playedAt: -1 }),

      RecallSequenceResult.find({
        patientId: { $in: patientIds },
      }).sort({ playedAt: -1 }),

      RecognitionResult.find({
        patientId: { $in: patientIds },
      }).sort({ playedAt: -1 }),

      RoutineResult.find({
        patientId: { $in: patientIds },
      }).sort({ playedAt: -1 }),
    ]);

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      patients,

      analytics: {
        memory: memoryResults,
        puzzle: puzzleResults,
        recallSequence: recallSequenceResults,
        recognition: recognitionResults,
        routine: routineResults,
      },
    });
  } catch (error) {
    console.error("Caretaker analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch caretaker analytics",
    });
  }
};

module.exports = {
  getCaretakerAnalytics,
};
