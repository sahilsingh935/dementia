import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "./GameAnalytics.css";

import { getPatients, getAnalytics } from "../services/api";

export default function RecognitionAnalytics() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const getPatientId = (patient) => {
    return (
      patient?._id || patient?.id || patient?.backendId || patient?.patientId
    );
  };

  const getResultPatientId = (result) => {
    if (!result?.patientId) {
      return null;
    }

    if (typeof result.patientId === "object") {
      return result.patientId._id || result.patientId.id;
    }

    return result.patientId;
  };

  const getResultDate = (result) => {
    return result?.createdAt || result?.playedAt || result?.updatedAt || null;
  };

  const getNumber = (result, ...keys) => {
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
  };

  const average = (values) => {
    if (!values.length) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [patientsResponse, analyticsResponse] = await Promise.all([
        getPatients(),
        getAnalytics(),
      ]);

      const patients =
        patientsResponse?.patients || patientsResponse?.data || [];

      const analytics =
        analyticsResponse?.analytics || analyticsResponse?.data || {};

      const selectedPatient = patients.find(
        (patient) => String(getPatientId(patient)) === String(patientId),
      );

      if (!selectedPatient) {
        setError("Patient not found.");
        return;
      }

      setPatient(selectedPatient);

      // ========================================
      // RECOGNITION RESULTS
      // ========================================

      const recognitionResults = Array.isArray(analytics?.recognition)
        ? analytics.recognition
        : [];

      const patientResults = recognitionResults.filter(
        (result) => String(getResultPatientId(result)) === String(patientId),
      );

      // Latest first
      patientResults.sort(
        (a, b) =>
          new Date(getResultDate(b) || 0) - new Date(getResultDate(a) || 0),
      );

      setResults(patientResults);
    } catch (err) {
      console.error("Recognition analytics error:", err);

      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const accuracies = results
    .map((result) => getNumber(result, "accuracy"))
    .filter((value) => value !== null);

  const scores = results
    .map((result) => getNumber(result, "score"))
    .filter((value) => value !== null);

  const attempts = results
    .map((result) => getNumber(result, "totalAttempts"))
    .filter((value) => value !== null);

  const correctAttempts = results
    .map((result) => getNumber(result, "correctAttempts"))
    .filter((value) => value !== null);

  const mistakes = results
    .map((result) => getNumber(result, "mistakes"))
    .filter((value) => value !== null);

  const responseTimes = results
    .map((result) => getNumber(result, "responseTime"))
    .filter((value) => value !== null);

  const avgAccuracy = average(accuracies);

  const bestScore = scores.length ? Math.max(...scores) : null;

  const avgAttempts = average(attempts);

  const avgCorrect = average(correctAttempts);

  const avgMistakes = average(mistakes);

  const avgResponseTime = average(responseTimes);

  const latestResult = results.length ? results[0] : null;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          Loading Recognition analytics...
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <h2>Unable to load analytics</h2>

          <p>{error}</p>

          <button onClick={() => navigate(`/caretaker/patient/${patientId}`)}>
            ← Back to Patient
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="analytics-page">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="analytics-header">
        <button
          className="back-button"
          onClick={() => navigate(`/caretaker/patient/${patientId}`)}
        >
          ← Back
        </button>

        <div>
          <p className="analytics-eyebrow">GAME ANALYTICS</p>

          <h1>Let's Remember</h1>

          <p className="analytics-subtitle">
            {patient?.name || "Patient"}

            {patient?.username ? ` • @${patient.username}` : ""}
          </p>
        </div>
      </div>

      {/* ======================================
          STAT CARDS
      ====================================== */}

      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <span>Total Sessions</span>

          <strong>{results.length}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>Avg Accuracy</span>

          <strong>
            {accuracies.length ? `${avgAccuracy.toFixed(1)}%` : "—"}
          </strong>
        </div>

        <div className="analytics-stat-card">
          <span>Best Score</span>

          <strong>{bestScore !== null ? bestScore.toFixed(1) : "—"}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>Avg Attempts</span>

          <strong>{attempts.length ? avgAttempts.toFixed(1) : "—"}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>Avg Mistakes</span>

          <strong>{mistakes.length ? avgMistakes.toFixed(1) : "—"}</strong>
        </div>

        <div className="analytics-stat-card">
          <span>Avg Response Time</span>

          <strong>
            {responseTimes.length ? `${avgResponseTime.toFixed(1)}s` : "—"}
          </strong>
        </div>
      </div>

      {/* ======================================
          LATEST PERFORMANCE
      ====================================== */}

      {latestResult && (
        <section className="analytics-section">
          <div className="section-heading">
            <div>
              <p className="analytics-eyebrow">LATEST SESSION</p>

              <h2>Latest Performance</h2>
            </div>
          </div>

          <div className="latest-performance">
            <div>
              <span>Accuracy</span>

              <strong>
                {getNumber(latestResult, "accuracy") !== null
                  ? `${getNumber(latestResult, "accuracy").toFixed(1)}%`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Score</span>

              <strong>
                {getNumber(latestResult, "score") !== null
                  ? getNumber(latestResult, "score").toFixed(1)
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Level</span>

              <strong>{latestResult?.level ?? "—"}</strong>
            </div>

            <div>
              <span>Correct</span>

              <strong>{latestResult?.correctAttempts ?? "—"}</strong>
            </div>

            <div>
              <span>Difficulty</span>

              <strong>
                {latestResult?.difficultyChange ||
                  latestResult?.difficulty ||
                  "—"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* ======================================
          SESSION HISTORY
      ====================================== */}

      <section className="analytics-section">
        <div className="section-heading">
          <div>
            <p className="analytics-eyebrow">HISTORY</p>

            <h2>Session History</h2>
          </div>

          <span className="session-count">{results.length} sessions</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👀</div>

            <h3>No Recognition sessions yet</h3>

            <p>
              Once the patient plays Let's Remember, their performance will
              appear here.
            </p>
          </div>
        ) : (
          <div className="session-table-wrapper">
            <table className="session-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Level</th>
                  <th>Attempts</th>
                  <th>Correct</th>
                  <th>Mistakes</th>
                  <th>Accuracy</th>
                  <th>Score</th>
                  <th>Response Time</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {results.map((result, index) => {
                  const accuracy = getNumber(result, "accuracy");

                  const score = getNumber(result, "score");

                  const responseTime = getNumber(result, "responseTime");

                  return (
                    <tr key={result?._id || result?.id || index}>
                      <td>{formatDate(getResultDate(result))}</td>

                      <td>{result?.level ?? "—"}</td>

                      <td>{result?.totalAttempts ?? "—"}</td>

                      <td>{result?.correctAttempts ?? "—"}</td>

                      <td>{result?.mistakes ?? "—"}</td>

                      <td>
                        <span className="accuracy-value">
                          {accuracy !== null ? `${accuracy.toFixed(1)}%` : "—"}
                        </span>
                      </td>

                      <td>{score !== null ? score.toFixed(1) : "—"}</td>

                      <td>
                        {responseTime !== null
                          ? `${responseTime.toFixed(1)}s`
                          : "—"}
                      </td>

                      <td>
                        {result?.difficultyChange || result?.difficulty || "—"}
                      </td>

                      <td>
                        <span
                          className={
                            result?.completed
                              ? "status-completed"
                              : "status-incomplete"
                          }
                        >
                          {result?.completed ? "Completed" : "Incomplete"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
