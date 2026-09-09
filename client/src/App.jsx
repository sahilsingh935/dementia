import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NetworkStatus from "./components/NetworkStatus";

import { startAutoSync } from "./services/sync";
import * as recallSequenceSync from "./services/recallSequenceSync";
import { startPuzzleAutoSync } from "./services/puzzleSync";
import { startRecognitionAutoSync } from "./services/recognitionSync";
import { startRoutineAutoSync } from "./services/routineSync";

import Home from "./pages/Home";
import PatientHome from "./pages/PatientHome";
import Games from "./pages/Games";
import Reminders from "./pages/Reminders";
import Profile from "./pages/Profile";

import MemoryGame from "./games/memory/MemoryGame";
import AttentionGame from "./games/attention/AttentionGame";
import RoutineGame from "./games/routine/RoutineGame";
import RecognitionGame from "./games/recognition/RecognitionGame";
import RecallSequenceGame from "./games/memory/RecallSequenceGame";

function App() {
  /*
    =========================
    AUTOMATIC OFFLINE SYNC
    =========================
  */

  useEffect(() => {
    // =================================
    // EXISTING GAMES SYNC
    // =================================

    const cleanupGameSync = startAutoSync();

    // =================================
    // RECALL SEQUENCE SYNC
    // =================================

    let cleanupRecallSequenceSync = () => {};

    if (typeof recallSequenceSync.startRecallSequenceAutoSync === "function") {
      cleanupRecallSequenceSync =
        recallSequenceSync.startRecallSequenceAutoSync();
    } else if (
      typeof recallSequenceSync.startRecallSequenceSync === "function"
    ) {
      cleanupRecallSequenceSync = recallSequenceSync.startRecallSequenceSync();
    }

    // =================================
    // PUZZLE GAME SYNC
    // =================================

    const cleanupPuzzleSync = startPuzzleAutoSync();

    // =================================
    // RECOGNITION GAME SYNC
    // =================================

    const cleanupRecognitionSync = startRecognitionAutoSync();

    // =================================
    // ROUTINE GAME SYNC
    // =================================

    const cleanupRoutineSync = startRoutineAutoSync();

    // =================================
    // CLEANUP
    // =================================

    return () => {
      cleanupGameSync();

      cleanupRecallSequenceSync();

      cleanupPuzzleSync();

      cleanupRecognitionSync();

      cleanupRoutineSync();
    };
  }, []);

  return (
    <BrowserRouter>
      <NetworkStatus />

      <Routes>
        {/* =========================
            MAIN PAGES
        ========================= */}

        <Route path="/" element={<Home />} />

        <Route path="/patient" element={<PatientHome />} />

        <Route path="/games" element={<Games />} />

        <Route path="/reminders" element={<Reminders />} />

        <Route path="/profile" element={<Profile />} />

        {/* =========================
            GAMES
        ========================= */}

        <Route path="/games/memory" element={<MemoryGame />} />

        <Route path="/games/attention" element={<AttentionGame />} />

        <Route path="/games/routine" element={<RoutineGame />} />

        <Route path="/games/recognition" element={<RecognitionGame />} />

        {/* =========================
            RECALL SEQUENCE
        ========================= */}

        <Route
          path="/games/memory/recall-sequence"
          element={<RecallSequenceGame />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
