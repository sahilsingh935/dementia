const jwt = require("jsonwebtoken");

// ========================================
// PROTECT ROUTE
// ========================================

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Token nahi mila
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Bearer TOKEN
    const token = authHeader.split(" ")[1];

    // Token verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User information request ke andar save
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ========================================
// CARETAKER ONLY
// ========================================

const caretakerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "caretaker") {
    return res.status(403).json({
      message: "Caretaker access required",
    });
  }

  next();
};

// ========================================
// PATIENT ONLY
// ========================================

const patientOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "patient") {
    return res.status(403).json({
      message: "Patient access required",
    });
  }

  next();
};

module.exports = {
  protect,
  caretakerOnly,
  patientOnly,
};
