import React, { useEffect, useMemo, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import "./PatientDetail.css";

const API_URL = "http://localhost:5000/api";

// =========================================================
// AUTH
// =========================================================

function getAuth() {
  return {
    token:
      localStorage.getItem("manasToken") ||
      sessionStorage.getItem("manasToken"),

    role:
      localStorage.getItem("manasRole") || sessionStorage.getItem("manasRole"),
  };
}

// =========================================================
// HELPERS
// =========================================================

function getPatientId(patient) {
  return String(
    patient?._id ||
      patient?.backendId ||
      patient?.id ||
      patient?.patientId ||
      "",
  );
}

function getResultPatientId(result) {
  if (!result?.patientId) {
    return "";
  }

  if (typeof result.patientId === "object") {
    return String(result.patientId._id || result.patientId.id || "");
  }

  return String(result.patientId);
}

function getNumber(result, ...keys) {
  for (const key of keys) {
    const value = result?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return null;
}

function average(values) {
  const validValues = values.filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

  if (!validValues.length) {
    return 0;
  }

  return (
    validValues.reduce((sum, value) => sum + value, 0) / validValues.length
  );
}

// =========================================================
// GAME CONFIG
// =========================================================

const GAME_CONFIG = {
  memory: {
    name: "Match the Pairs",
    description: "Track memory, matching accuracy and recall performance.",
    icon: "🧩",
    route: "memory",
  },

  puzzle: {
    name: "Pattern Completion",
    description: "Track pattern recognition, accuracy and response time.",
    icon: "🔷",
    route: "puzzle",
  },

  recallSequence: {
    name: "Recall The Sequence",
    description: "Track sequence memory, attempts and recall accuracy.",
    icon: "🧠",
    route: "recall-sequence",
  },

  recognition: {
    name: "Let's Remember",
    description: "Track recognition accuracy, mistakes and performance.",
    icon: "👀",
    route: "recognition",
  },

  routine: {
    name: "Odd One Out",
    description: "Track decision making, accuracy and difficulty progression.",
    icon: "🔍",
    route: "routine",
  },
};

const GAME_KEYS = [
  "memory",
  "puzzle",
  "recallSequence",
  "recognition",
  "routine",
];

// =========================================================
// GET PATIENT RESULTS
// =========================================================

function getPatientResults(analytics, patientId) {
  const filterResults = (results) => {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.filter(
      (result) => getResultPatientId(result) === String(patientId),
    );
  };

  return {
    memory: filterResults(analytics?.memory),

    puzzle: filterResults(analytics?.puzzle),

    recallSequence: filterResults(analytics?.recallSequence),

    recognition: filterResults(analytics?.recognition),

    routine: filterResults(analytics?.routine),
  };
}

// =========================================================
// GAME CARD
// =========================================================

function GameCard({ gameKey, results, patientId, onOpenAnalytics }) {
  const config = GAME_CONFIG[gameKey];

  const accuracies = results
    .map((result) => getNumber(result, "accuracy"))
    .filter((value) => value !== null);

  const scores = results
    .map((result) => getNumber(result, "score"))
    .filter((value) => value !== null);

  const avgAccuracy = average(accuracies);

  const bestScore = scores.length ? Math.max(...scores) : null;

  const openGameAnalytics = () => {
    onOpenAnalytics(`/caretaker/patient/${patientId}/${config.route}`);
  };

  return (
    <div
      className="game-overview-card"
      onClick={openGameAnalytics}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          openGameAnalytics();
        }
      }}
    >
      {/* ICON */}

      <div className="game-overview-icon">{config.icon}</div>

      {/* CONTENT */}

      <div className="game-overview-content">
        <div className="game-overview-heading">
          <div>
            <h3>{config.name}</h3>

            <p>{config.description}</p>
          </div>

          <span className="game-card-arrow">→</span>
        </div>

        {/* STATS */}

        <div className="game-overview-stats">
          <div>
            <span>Sessions</span>

            <strong>{results.length}</strong>
          </div>

          <div>
            <span>Avg Accuracy</span>

            <strong>
              {accuracies.length ? `${avgAccuracy.toFixed(1)}%` : "—"}
            </strong>
          </div>

          <div>
            <span>Best Score</span>

            <strong>{bestScore !== null ? bestScore : "—"}</strong>
          </div>
        </div>

        {/* BUTTON */}

        <div className="game-card-link">View Analytics →</div>
      </div>
    </div>
  );
}

// =========================================================
// MAIN PATIENT DETAIL / OVERVIEW
// =========================================================

export default function PatientDetail() {
  const { patientId } = useParams();

  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =======================================================
  // LOAD DATA
  // =======================================================

  const loadData = async () => {
    const { token, role } = getAuth();

    if (!token || role !== "caretaker") {
      window.location.href = "http://localhost:5173/";

      return;
    }

    if (!patientId) {
      setError("Patient ID is missing from URL.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");

      // ===================================================
      // GET PATIENTS
      // ===================================================

      const patientsResponse = await fetch(`${API_URL}/auth/patients`, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (patientsResponse.status === 401) {
        throw new Error("Your caretaker session has expired.");
      }

      if (patientsResponse.status === 403) {
        throw new Error("Caretaker access required.");
      }

      if (!patientsResponse.ok) {
        throw new Error("Unable to load patients.");
      }

      const patientsData = await patientsResponse.json();

      const patients = Array.isArray(patientsData)
        ? patientsData
        : Array.isArray(patientsData?.patients)
          ? patientsData.patients
          : [];

      // ===================================================
      // FIND PATIENT
      // ===================================================

      const foundPatient = patients.find(
        (patientItem) => getPatientId(patientItem) === String(patientId),
      );

      if (!foundPatient) {
        throw new Error(
          "Patient not found or you are not authorized to view this patient.",
        );
      }

      setPatient(foundPatient);

      // ===================================================
      // GET ANALYTICS
      // ===================================================

      const analyticsResponse = await fetch(`${API_URL}/caretaker/analytics`, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (analyticsResponse.status === 401) {
        throw new Error("Your caretaker session has expired.");
      }

      if (analyticsResponse.status === 403) {
        throw new Error("You are not authorized to view analytics.");
      }

      if (!analyticsResponse.ok) {
        throw new Error(
          `Analytics request failed: ${analyticsResponse.status}`,
        );
      }

      const analyticsData = await analyticsResponse.json();

      setAnalytics(analyticsData?.analytics || {});
    } catch (err) {
      console.error("Patient Detail Error:", err);

      setError(err.message || "Unable to load patient data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  // =======================================================
  // PATIENT RESULTS
  // =======================================================

  const patientResults = useMemo(() => {
    if (!patient || !analytics) {
      return {
        memory: [],
        puzzle: [],
        recallSequence: [],
        recognition: [],
        routine: [],
      };
    }

    return getPatientResults(analytics, getPatientId(patient));
  }, [patient, analytics]);

  // =======================================================
  // ALL RESULTS
  // =======================================================

  const allResults = useMemo(() => {
    return GAME_KEYS.flatMap((gameKey) => patientResults[gameKey] || []);
  }, [patientResults]);

  // =======================================================
  // OVERALL ACCURACY
  // =======================================================

  const overallAccuracy = useMemo(() => {
    const accuracies = allResults
      .map((result) => getNumber(result, "accuracy"))
      .filter((value) => value !== null);

    return average(accuracies);
  }, [allResults]);

  // =======================================================
  // BEST SCORE
  // =======================================================

  const bestScore = useMemo(() => {
    const scores = allResults
      .map((result) => getNumber(result, "score"))
      .filter((value) => value !== null);

    return scores.length ? Math.max(...scores) : null;
  }, [allResults]);

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="patient-page">
        <div className="loading-box">
          <div className="spinner" />

          <h2>Loading Patient Data...</h2>

          <p>Fetching patient information.</p>
        </div>
      </div>
    );
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (error || !patient) {
    return (
      <div className="patient-page">
        <div className="error-box">
          <div className="error-icon">⚠️</div>

          <h2>Unable to load patient</h2>

          <p>{error || "Patient not found."}</p>

          <button onClick={() => navigate("/caretaker")}>
            ← Back to Patients
          </button>
        </div>
      </div>
    );
  }

  // =======================================================
  // CURRENT PATIENT
  // =======================================================

  const currentPatientId = getPatientId(patient);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="patient-page">
      <div className="patient-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="patient-header">
          <div className="brand">
            <img src="/manas-logo.png" alt="MANAS" />

            <div>
              <strong>MANAS</strong>

              <span>Patient Overview</span>
            </div>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/caretaker")}
          >
            ← Back to Patients
          </button>
        </header>

        {/* =================================================
            PATIENT PROFILE
        ================================================= */}

        <section className="card patient-card">
          <div className="patient-profile">
            <div className="patient-avatar">
              {patient.photo ? (
                <img src={patient.photo} alt={patient.name || "Patient"} />
              ) : (
                (patient.name || "P").charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <span className="record-label">PATIENT RECORD</span>

              <h1>{patient.name || "Patient"}</h1>

              <p>
                Username:{" "}
                <strong>{patient.username || patient.patientId || "—"}</strong>
              </p>
            </div>
          </div>

          <div className="patient-meta">
            <div>
              <span>Status</span>

              <strong className="active">Active</strong>
            </div>

            <div>
              <span>Total Sessions</span>

              <strong>{allResults.length}</strong>
            </div>

            <div>
              <span>Games Played</span>

              <strong>
                {
                  GAME_KEYS.filter(
                    (gameKey) => patientResults[gameKey]?.length > 0,
                  ).length
                }
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            PERFORMANCE OVERVIEW
        ================================================= */}

        <section className="card overview-card">
          <div className="section-title">
            <div>
              <h2>Performance Overview</h2>

              <p>Overall cognitive game performance.</p>
            </div>

            <button className="refresh-button" onClick={loadData}>
              ↻ Refresh Data
            </button>
          </div>

          <div className="overview-grid">
            <div className="overview-item">
              <span>Total Sessions</span>

              <strong>{allResults.length}</strong>
            </div>

            <div className="overview-item">
              <span>Overall Accuracy</span>

              <strong>{overallAccuracy.toFixed(1)}%</strong>
            </div>

            <div className="overview-item">
              <span>Best Score</span>

              <strong>{bestScore !== null ? bestScore : "—"}</strong>
            </div>

            <div className="overview-item">
              <span>Games Played</span>

              <strong>
                {
                  GAME_KEYS.filter(
                    (gameKey) => patientResults[gameKey]?.length > 0,
                  ).length
                }
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            GAMES
        ================================================= */}

        <section className="games-overview-section">
          <div className="database-heading">
            <div>
              <h2>Cognitive Games</h2>

              <p>Select a game to view detailed performance analytics.</p>
            </div>
          </div>

          <div className="games-overview-grid">
            {GAME_KEYS.map((gameKey) => (
              <GameCard
                key={gameKey}
                gameKey={gameKey}
                patientId={currentPatientId}
                results={patientResults[gameKey] || []}
                onOpenAnalytics={(route) => navigate(route)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
