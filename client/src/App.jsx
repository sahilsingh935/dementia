import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import NetworkStatus from "./components/NetworkStatus";

// ================================
// SYNC SERVICES
// ================================

import { startAutoSync } from "./services/sync";
import { startPuzzleAutoSync } from "./services/puzzleSync";
import { startRecognitionAutoSync } from "./services/recognitionSync";
import { startRoutineAutoSync } from "./services/routineSync";
import { startRecallSequenceAutoSync } from "./services/recallSequenceSync";

// ================================
// PAGES
// ================================

import Home from "./pages/Home";
import PatientHome from "./pages/PatientHome";
import Games from "./pages/Games";
import Reminders from "./pages/Reminders";
import Profile from "./pages/Profile";

// ================================
// GAMES
// ================================

import MemoryGame from "./games/memory/MemoryGame";
import AttentionGame from "./games/attention/AttentionGame";
import RoutineGame from "./games/routine/RoutineGame";
import RecognitionGame from "./games/recognition/RecognitionGame";
import RecallSequenceGame from "./games/memory/RecallSequenceGame";

// ======================================
// AUTH HELPER
// ======================================

function getAuth() {
  const token =
    localStorage.getItem("manasToken") ||
    sessionStorage.getItem("manasToken") ||
    null;

  const role =
    localStorage.getItem("manasRole") ||
    sessionStorage.getItem("manasRole") ||
    null;

  const userId =
    localStorage.getItem("manasUserId") ||
    sessionStorage.getItem("manasUserId") ||
    null;

  return {
    token,
    role,
    userId,
  };
}

// ======================================
// PROTECTED PATIENT ROUTE
// ======================================

function PatientRoute({ children }) {
  const location = useLocation();
  const { token, role } = getAuth();

  if (!token || role !== "patient") {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
          message: "Please login as a patient first.",
        }}
      />
    );
  }

  return children;
}

// ======================================
// PROTECTED GAME ROUTE
// ======================================

function PatientGameRoute({ children }) {
  const { token, role } = getAuth();

  if (!token || role !== "patient") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ======================================
// MAIN APP
// ======================================

function App() {
  // ======================================
  // START ALL AUTO SYNC SERVICES
  // ======================================

  useEffect(() => {
    // Memory / common game sync
    const cleanupGameSync = startAutoSync();

    // Puzzle / Attention
    const cleanupPuzzleSync = startPuzzleAutoSync();

    // Recognition
    const cleanupRecognitionSync = startRecognitionAutoSync();

    // Routine
    const cleanupRoutineSync = startRoutineAutoSync();

    // Recall Sequence
    const cleanupRecallSequenceSync = startRecallSequenceAutoSync();

    // ======================================
    // CLEANUP
    // ======================================

    return () => {
      cleanupGameSync?.();
      cleanupPuzzleSync?.();
      cleanupRecognitionSync?.();
      cleanupRoutineSync?.();
      cleanupRecallSequenceSync?.();
    };
  }, []);

  return (
    <BrowserRouter>
      <NetworkStatus />

      <Routes>
        {/* ==================================
            PUBLIC
        ================================== */}

        <Route path="/" element={<Home />} />

        {/* ==================================
            PATIENT HOME
        ================================== */}

        <Route
          path="/patient"
          element={
            <PatientRoute>
              <PatientHome />
            </PatientRoute>
          }
        />

        {/* ==================================
            PATIENT PAGES
        ================================== */}

        <Route
          path="/games"
          element={
            <PatientRoute>
              <Games />
            </PatientRoute>
          }
        />

        <Route
          path="/reminders"
          element={
            <PatientRoute>
              <Reminders />
            </PatientRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PatientRoute>
              <Profile />
            </PatientRoute>
          }
        />

        {/* ==================================
            MEMORY GAME
        ================================== */}

        <Route
          path="/games/memory"
          element={
            <PatientGameRoute>
              <MemoryGame />
            </PatientGameRoute>
          }
        />

        {/* ==================================
            ATTENTION / PUZZLE GAME
        ================================== */}

        <Route
          path="/games/attention"
          element={
            <PatientGameRoute>
              <AttentionGame />
            </PatientGameRoute>
          }
        />

        {/* ==================================
            ROUTINE GAME
        ================================== */}

        <Route
          path="/games/routine"
          element={
            <PatientGameRoute>
              <RoutineGame />
            </PatientGameRoute>
          }
        />

        {/* ==================================
            RECOGNITION GAME
        ================================== */}

        <Route
          path="/games/recognition"
          element={
            <PatientGameRoute>
              <RecognitionGame />
            </PatientGameRoute>
          }
        />

        {/* ==================================
            RECALL SEQUENCE
        ================================== */}

        <Route
          path="/games/memory/recall-sequence"
          element={
            <PatientGameRoute>
              <RecallSequenceGame />
            </PatientGameRoute>
          }
        />

        {/* ==================================
            FALLBACK
        ================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
