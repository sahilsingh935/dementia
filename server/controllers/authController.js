const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// ========================================
// GENERATE JWT TOKEN
// ========================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// ========================================
// CARETAKER SIGNUP
// ========================================

const caretakerSignup = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Check required fields
    if (!name || !username || !password) {
      return res.status(400).json({
        message: "Name, username and password are required",
      });
    }

    // Check username
    const cleanUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
      username: cleanUsername,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create caretaker
    const caretaker = await User.create({
      name: name.trim(),

      username: cleanUsername,

      password: hashedPassword,

      role: "caretaker",

      createdBy: null,
    });

    // Generate token
    const token = generateToken(caretaker);

    return res.status(201).json({
      message: "Caretaker account created successfully",

      token,

      user: {
        id: caretaker._id,
        name: caretaker.name,
        username: caretaker.username,
        role: caretaker.role,
      },
    });
  } catch (error) {
    console.error("Caretaker signup error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Required fields
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      username: cleanUsername,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Generate JWT
    const token = generateToken(user);

    // Role based redirect
    const redirect = user.role === "patient" ? "/patient" : "/caretaker";

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },

      redirect,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ========================================
// ADD PATIENT
// ========================================

const addPatient = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Required fields
    if (!name || !username || !password) {
      return res.status(400).json({
        message: "Patient name, username and password are required",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check username
    const existingUser = await User.findOne({
      username: cleanUsername,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    // Hash patient password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create patient
    const patient = await User.create({
      name: name.trim(),

      username: cleanUsername,

      password: hashedPassword,

      role: "patient",

      // Logged-in caretaker ID
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Patient created successfully",

      patient: {
        id: patient._id,
        name: patient.name,
        username: patient.username,
        role: patient.role,
      },

      // Caretaker ko credentials dikhane ke liye
      credentials: {
        username: cleanUsername,
        password: password,
      },
    });
  } catch (error) {
    console.error("Add patient error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ========================================
// GET CURRENT USER
// ========================================

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ========================================
// GET CARETAKER'S PATIENTS
// ========================================

const getPatients = async (req, res) => {
  try {
    const patients = await User.find({
      role: "patient",

      createdBy: req.user.id,
    })
      .select("-password")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      patients,
    });
  } catch (error) {
    console.error("Get patients error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  caretakerSignup,
  login,
  addPatient,
  getMe,
  getPatients,
};
