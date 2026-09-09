const express = require("express");

const router = express.Router();

const {
  caretakerSignup,
  login,
  addPatient,
  getMe,
  getPatients,
} = require("../controllers/authController");

const { protect, caretakerOnly } = require("../middleware/authMiddleware");

// ========================================
// CARETAKER SIGNUP
// ========================================

router.post("/caretaker/signup", caretakerSignup);

// ========================================
// LOGIN
// Caretaker + Patient
// ========================================

router.post("/login", login);

// ========================================
// CURRENT USER
// Protected
// ========================================

router.get("/me", protect, getMe);

// ========================================
// ADD PATIENT
// Caretaker only
// ========================================

router.post("/patient", protect, caretakerOnly, addPatient);

// ========================================
// GET CARETAKER'S PATIENTS
// Caretaker only
// ========================================

router.get("/patients", protect, caretakerOnly, getPatients);

module.exports = router;
