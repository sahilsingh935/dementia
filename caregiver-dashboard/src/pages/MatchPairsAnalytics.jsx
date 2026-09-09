import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./PatientDetail.css";

const API_URL = "http://localhost:5000/api";

/* =========================================================
   AUTH
========================================================= */

function getToken() {
  return (
    localStorage.getItem("manasToken") ||
    sessionStorage.getItem("manasToken") ||
    null
  );
}

/* =========================================================
   HELPERS
========================================================= */

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
    return String(result.patientId?._id || result.patientId?.id || "");
  }

  return String(result.patientId);
}

function getNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function average(values) {
  const valid = values.filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

  if (!valid.length) {
    return 0;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getResultDate(result) {
  const value = result?.createdAt || result?.playedAt || result?.updatedAt;

  if (!value) {
    return new Date(0);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function formatDate(date) {
  if (!date || date.getTime() === 0) {
    return "Unknown date";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function MatchPairsAnalytics() {
  const { patientId } = useParams();

  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Caretaker authentication required.");
      }

      if (!patientId) {
        throw new Error("Patient ID is missing from URL.");
      }

      /* ---------------------------------------------------
         GET PATIENTS
      --------------------------------------------------- */

      const patientsResponse = await fetch(`${API_URL}/auth/patients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!patientsResponse.ok) {
        let message = "Unable to load patients.";

        try {
          const data = await patientsResponse.json();

          message = data?.message || message;
        } catch {}

        throw new Error(message);
      }

      const patientsData = await patientsResponse.json();

      const patients = Array.isArray(patientsData)
        ? patientsData
        : Array.isArray(patientsData?.patients)
          ? patientsData.patients
          : [];

      const currentPatient = patients.find(
        (item) => getPatientId(item) === String(patientId),
      );

      if (!currentPatient) {
        throw new Error(
          "Patient not found or you are not authorized to view this patient.",
        );
      }

      setPatient(currentPatient);

      /* ---------------------------------------------------
         GET CARETAKER ANALYTICS
      --------------------------------------------------- */

      const analyticsResponse = await fetch(`${API_URL}/caretaker/analytics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!analyticsResponse.ok) {
        let message = "Unable to load analytics.";

        try {
          const data = await analyticsResponse.json();

          message = data?.message || message;
        } catch {}

        throw new Error(message);
      }

      const analyticsData = await analyticsResponse.json();

      console.log("CARETAKER ANALYTICS:", analyticsData);

      const memoryResults = Array.isArray(analyticsData?.analytics?.memory)
        ? analyticsData.analytics.memory
        : [];

      console.log("ALL MEMORY RESULTS:", memoryResults);

      /* ---------------------------------------------------
         FILTER CURRENT PATIENT
      --------------------------------------------------- */

      const patientMemoryResults = memoryResults.filter(
        (result) => getResultPatientId(result) === String(patientId),
      );

      console.log("CURRENT PATIENT MEMORY RESULTS:", patientMemoryResults);

      /* ---------------------------------------------------
         SORT LATEST FIRST
      --------------------------------------------------- */

      patientMemoryResults.sort((a, b) => getResultDate(b) - getResultDate(a));

      setResults(patientMemoryResults);
    } catch (err) {
      console.error("Match Pairs Analytics Error:", err);

      setError(err.message || "Unable to load Match the Pairs analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [patientId]);

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const statistics = useMemo(() => {
    if (!results.length) {
      return {
        totalSessions: 0,
        avgAccuracy: 0,
        bestScore: null,
        avgMoves: 0,
        avgMistakes: 0,
        avgTime: 0,
      };
    }

    const accuracies = results
      .map((result) => getNumber(result.accuracy))
      .filter((value) => value !== null);

    const scores = results
      .map((result) => getNumber(result.score))
      .filter((value) => value !== null);

    const moves = results
      .map((result) => getNumber(result.moves))
      .filter((value) => value !== null);

    const mistakes = results
      .map((result) => getNumber(result.mistakes))
      .filter((value) => value !== null);

    const times = results
      .map((result) => getNumber(result.seconds))
      .filter((value) => value !== null);

    return {
      totalSessions: results.length,

      avgAccuracy: average(accuracies),

      bestScore: scores.length ? Math.max(...scores) : null,

      avgMoves: average(moves),

      avgMistakes: average(mistakes),

      avgTime: average(times),
    };
  }, [results]);

  const latest = results[0] || null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="patient-page">
        <div className="loading-box">
          <div className="spinner" />

          <h2>Loading Match the Pairs Analytics...</h2>

          <p>Fetching memory performance data.</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="patient-page">
        <div className="error-box">
          <div className="error-icon">⚠️</div>

          <h2>Unable to Load Analytics</h2>

          <p>{error}</p>

          <button onClick={loadData}>Try Again</button>

          <button
            style={{
              marginTop: "10px",
              background: "#e9f1eb",
              color: "#214f3b",
            }}
            onClick={() => navigate(`/caretaker/patient/${patientId}`)}
          >
            ← Back to Patient
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="patient-page">
      <div className="patient-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="patient-header">
          <div className="brand">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#e8f1eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
              }}
            >
              🧩
            </div>

            <div>
              <strong>MANAS</strong>

              <span>Match the Pairs Analytics</span>
            </div>
          </div>

          <button
            className="back-button"
            onClick={() => navigate(`/caretaker/patient/${patientId}`)}
          >
            ← Back to Patient
          </button>
        </header>

        {/* =================================================
            GAME HEADER
        ================================================= */}

        <section className="card patient-card">
          <div className="patient-profile">
            <div className="patient-avatar">
              {(patient?.name || "P").charAt(0).toUpperCase()}
            </div>

            <div>
              <span className="record-label">MEMORY GAME</span>

              <h1>Match the Pairs</h1>

              <p>
                Patient: <strong>{patient?.name || "Patient"}</strong>
              </p>
            </div>
          </div>

          <div className="patient-meta">
            <div>
              <span>Sessions</span>

              <strong>{statistics.totalSessions}</strong>
            </div>

            <div>
              <span>Avg Accuracy</span>

              <strong>{statistics.avgAccuracy.toFixed(1)}%</strong>
            </div>

            <div>
              <span>Best Score</span>

              <strong>
                {statistics.bestScore !== null ? statistics.bestScore : "—"}
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            PAGE DESCRIPTION
        ================================================= */}

        <section className="card overview-card">
          <div className="section-title">
            <div>
              <h2>Match the Pairs Performance</h2>

              <p>Detailed memory, matching accuracy and recall performance.</p>
            </div>

            <button className="refresh-button" onClick={loadData}>
              ↻ Refresh Data
            </button>
          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="overview-grid">
            <div className="overview-item">
              <span>Total Sessions</span>

              <strong>{statistics.totalSessions}</strong>
            </div>

            <div className="overview-item">
              <span>Average Accuracy</span>

              <strong>{statistics.avgAccuracy.toFixed(1)}%</strong>
            </div>

            <div className="overview-item">
              <span>Best Score</span>

              <strong>
                {statistics.bestScore !== null ? statistics.bestScore : "—"}
              </strong>
            </div>

            <div className="overview-item">
              <span>Average Moves</span>

              <strong>
                {statistics.avgMoves ? statistics.avgMoves.toFixed(1) : "—"}
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            LATEST PERFORMANCE
        ================================================= */}

        {latest && (
          <section className="analytics-section">
            <div className="section-heading">
              <h2>Latest Performance</h2>

              <span className="session-count">Session #{results.length}</span>
            </div>

            <div className="latest-performance">
              <div>
                <span>Accuracy</span>

                <strong>
                  {getNumber(latest.accuracy) !== null
                    ? `${getNumber(latest.accuracy).toFixed(1)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Score</span>

                <strong>
                  {getNumber(latest.score) !== null
                    ? getNumber(latest.score)
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Moves</span>

                <strong>
                  {getNumber(latest.moves) !== null
                    ? getNumber(latest.moves)
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Mistakes</span>

                <strong>
                  {getNumber(latest.mistakes) !== null
                    ? getNumber(latest.mistakes)
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Time</span>

                <strong>
                  {getNumber(latest.seconds) !== null
                    ? `${getNumber(latest.seconds).toFixed(1)}s`
                    : "—"}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            SESSION HISTORY
        ================================================= */}

        <section className="analytics-section">
          <div className="section-heading">
            <h2>Session History</h2>

            <span className="session-count">
              {results.length} {results.length === 1 ? "Session" : "Sessions"}
            </span>
          </div>

          {!results.length ? (
            <div className="empty-state">
              <div className="empty-icon">🧩</div>

              <h3>No Match the Pairs Data</h3>

              <p>
                No completed Match the Pairs sessions have been recorded for
                this patient yet.
              </p>
            </div>
          ) : (
            <div className="session-table-wrapper">
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Accuracy</th>
                    <th>Score</th>
                    <th>Moves</th>
                    <th>Mistakes</th>
                    <th>Time</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result, index) => {
                    const accuracy = getNumber(result.accuracy);

                    const score = getNumber(result.score);

                    const moves = getNumber(result.moves);

                    const mistakes = getNumber(result.mistakes);

                    const seconds = getNumber(result.seconds);

                    return (
                      <tr key={result._id || result.id || index}>
                        <td>
                          <strong>#{results.length - index}</strong>
                        </td>

                        <td>{formatDate(getResultDate(result))}</td>

                        <td>
                          {accuracy !== null ? (
                            <span className="accuracy-value">
                              {accuracy.toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <strong>{score !== null ? score : "—"}</strong>
                        </td>

                        <td>{moves !== null ? moves : "—"}</td>

                        <td>{mistakes !== null ? mistakes : "—"}</td>

                        <td>
                          {seconds !== null ? `${seconds.toFixed(1)}s` : "—"}
                        </td>

                        <td>
                          {result.difficultyChange || result.difficulty || "—"}
                        </td>

                        <td>
                          {result.completed !== false ? (
                            <span className="status-completed">Completed</span>
                          ) : (
                            <span className="status-incomplete">
                              Incomplete
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =================================================
            DEBUG INFO
        ================================================= */}

        <details className="raw-data-card">
          <summary>View Raw Match the Pairs Data</summary>

          <pre>{JSON.stringify(results, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}
