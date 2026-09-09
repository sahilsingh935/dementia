import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PatientDetail from "./pages/PatientDetail.jsx";
import CaretakerDashboard from "./pages/CaretakerDashboard.jsx";

import MatchPairsAnalytics from "./pages/MatchPairsAnalytics.jsx";
import PatternCompletionAnalytics from "./pages/PatternCompletionAnalytics.jsx";
import RecallSequenceAnalytics from "./pages/RecallSequenceAnalytics.jsx";
import RecognitionAnalytics from "./pages/RecognitionAnalytics.jsx";
import RoutineAnalytics from "./pages/RoutineAnalytics.jsx";

// ==========================================
// RECEIVE TOKEN FROM MAIN APP
// ==========================================

function receiveAuthHandoff() {
  const params = new URLSearchParams(window.location.search);

  const token = params.get("token");
  const role = params.get("role");
  const userId = params.get("userId");
  const userName = params.get("userName");
  const username = params.get("username");

  if (!token) {
    return false;
  }

  if (role !== "caretaker") {
    return false;
  }

  // Save authentication
  localStorage.setItem("manasToken", token);

  localStorage.setItem("manasRole", role);

  if (userId) {
    localStorage.setItem("manasUserId", userId);
  }

  if (userName) {
    localStorage.setItem("manasUser", userName);
  }

  if (username) {
    localStorage.setItem("manasUsername", username);
  }

  // Remove token from URL
  window.history.replaceState({}, document.title, "/caretaker");

  return true;
}

// ==========================================
// GET TOKEN
// ==========================================

function getToken() {
  return (
    localStorage.getItem("manasToken") || sessionStorage.getItem("manasToken")
  );
}

// ==========================================
// GET ROLE
// ==========================================

function getRole() {
  return (
    localStorage.getItem("manasRole") || sessionStorage.getItem("manasRole")
  );
}

// ==========================================
// PROTECTED CARETAKER ROUTE
// ==========================================

function ProtectedCaretaker({ children }) {
  const token = getToken();
  const role = getRole();

  if (!token || role !== "caretaker") {
    return <Navigate to="/auth-required" replace />;
  }

  return children;
}

// ==========================================
// AUTH REQUIRED
// ==========================================

function AuthRequired() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f8f2",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          textAlign: "center",
          background: "#fff",
          padding: "40px",
          borderRadius: "20px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 15px 40px rgba(33,79,59,0.12)",
        }}
      >
        <div
          style={{
            fontSize: "45px",
            marginBottom: "15px",
          }}
        >
          🔐
        </div>

        <h2
          style={{
            color: "#214f3b",
            margin: "0 0 10px",
          }}
        >
          Login Required
        </h2>

        <p
          style={{
            color: "#718178",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Please login as a caretaker from the main MANAS application.
        </p>

        <button
          onClick={() => {
            window.location.href = "http://localhost:5173/";
          }}
          style={{
            marginTop: "20px",
            border: "none",
            background: "#214f3b",
            color: "#fff",
            padding: "12px 22px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Go to MANAS Login
        </button>
      </div>
    </div>
  );
}

// ==========================================
// APP
// ==========================================

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    receiveAuthHandoff();
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ====================================
            CARETAKER DASHBOARD
        ==================================== */}

        <Route
          path="/caretaker"
          element={
            <ProtectedCaretaker>
              <CaretakerDashboard />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            PATIENT OVERVIEW
        ==================================== */}

        <Route
          path="/caretaker/patient/:patientId"
          element={
            <ProtectedCaretaker>
              <PatientDetail />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            MATCH THE PAIRS
        ==================================== */}

        <Route
          path="/caretaker/patient/:patientId/memory"
          element={
            <ProtectedCaretaker>
              <MatchPairsAnalytics />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            PATTERN COMPLETION
        ==================================== */}

        <Route
          path="/caretaker/patient/:patientId/puzzle"
          element={
            <ProtectedCaretaker>
              <PatternCompletionAnalytics />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            RECALL SEQUENCE
        ==================================== */}

        <Route
          path="/caretaker/patient/:patientId/recall-sequence"
          element={
            <ProtectedCaretaker>
              <RecallSequenceAnalytics />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            RECOGNITION / LET'S REMEMBER
        ==================================== */}

        <Route
          path="/caretaker/patient/:patientId/recognition"
          element={
            <ProtectedCaretaker>
              <RecognitionAnalytics />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            ODD ONE OUT / ROUTINE
        ==================================== */}

        <Route
          path="/caretaker/patient/:patientId/routine"
          element={
            <ProtectedCaretaker>
              <RoutineAnalytics />
            </ProtectedCaretaker>
          }
        />

        {/* ====================================
            AUTH REQUIRED
        ==================================== */}

        <Route path="/auth-required" element={<AuthRequired />} />

        {/* ====================================
            FALLBACK
        ==================================== */}

        <Route path="*" element={<Navigate to="/caretaker" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
