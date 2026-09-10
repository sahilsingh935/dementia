import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "./GameAnalytics.css";

import { getPatients, getAnalytics } from "../services/api";

export default function PatternCompletionAnalytics() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const getValue = (result, key) => {
    return result?.[key] ?? null;
  };

  const getPatientId = (patient) => {
    return (
      patient?._id || patient?.id || patient?.backendId || patient?.patientId
    );
  };

  const getResultPatientId = (result) => {
    if (!result?.patientId) return null;

    if (typeof result.patientId === "object") {
      return result.patientId._id || result.patientId.id;
    }

    return result.patientId;
  };

  const getResultDate = (result) => {
    return result?.createdAt || result?.playedAt || result?.updatedAt || null;
  };

  const getAccuracy = (result) => {
    const value = Number(result?.accuracy);

    return Number.isFinite(value) ? value : null;
  };

  const average = (values) => {
    if (!values.length) return 0;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const formatDate = (date) => {
    if (!date) return "—";

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

      const patientList =
        patientsResponse?.patients || patientsResponse?.data || [];

      const analytics =
        analyticsResponse?.analytics || analyticsResponse?.data || {};

      const selectedPatient = patientList.find(
        (patient) => String(getPatientId(patient)) === String(patientId),
      );

      if (!selectedPatient) {
        setError("Patient not found.");
        return;
      }

      setPatient(selectedPatient);

      // Pattern Completion = puzzle
      const puzzleResults = Array.isArray(analytics?.puzzle)
        ? analytics.puzzle
        : [];

      const patientResults = puzzleResults.filter(
        (result) => String(getResultPatientId(result)) === String(patientId),
      );

      // Latest first
      patientResults.sort(
        (a, b) =>
          new Date(getResultDate(b) || 0) - new Date(getResultDate(a) || 0),
      );

      setResults(patientResults);
    } catch (err) {
      console.error("Pattern Completion analytics error:", err);

      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const accuracies = results.map(getAccuracy).filter((value) => value !== null);

  const scores = results
    .map((result) => Number(getValue(result, "score")))
    .filter((value) => Number.isFinite(value));

  const times = results
    .map((result) => Number(getValue(result, "responseTime")))
    .filter((value) => Number.isFinite(value));

  const mistakes = results
    .map((result) => Number(getValue(result, "mistakes")))
    .filter((value) => Number.isFinite(value));

  const attempts = results
    .map((result) => Number(getValue(result, "totalAttempts")))
    .filter((value) => Number.isFinite(value));

  const avgAccuracy = average(accuracies);

  const avgScore = average(scores);

  const bestScore = scores.length ? Math.max(...scores) : null;

  const avgTime = average(times);

  const avgMistakes = average(mistakes);

  const avgAttempts = average(attempts);

  const latestResult = results.length ? results[0] : null;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          Loading Pattern Completion analytics...
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
      {/* HEADER */}

      <div className="analytics-header">
        <button
          className="back-button"
          onClick={() => navigate(`/caretaker/patient/${patientId}`)}
        >
          ← Back
        </button>

        <div>
          <p className="analytics-eyebrow">GAME ANALYTICS</p>

          <h1>Pattern Completion</h1>

          <p className="analytics-subtitle">
            {patient?.name || "Patient"}
            {patient?.username ? ` • @${patient.username}` : ""}
          </p>
        </div>
      </div>

      {/* OVERVIEW CARDS */}

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

          <strong>{times.length ? `${avgTime.toFixed(1)}s` : "—"}</strong>
        </div>
      </div>

      {/* LATEST PERFORMANCE */}

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
                {getAccuracy(latestResult) !== null
                  ? `${getAccuracy(latestResult).toFixed(1)}%`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Score</span>

              <strong>
                {Number.isFinite(Number(latestResult.score))
                  ? Number(latestResult.score).toFixed(1)
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Level</span>

              <strong>{getValue(latestResult, "level") ?? "—"}</strong>
            </div>

            <div>
              <span>Difficulty</span>

              <strong>
                {getValue(latestResult, "difficultyChange") ||
                  getValue(latestResult, "difficulty") ||
                  "—"}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* SESSION HISTORY */}

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
            <div className="empty-icon">🧩</div>

            <h3>No Pattern Completion sessions yet</h3>

            <p>
              Once the patient plays Pattern Completion, their performance will
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
                  const accuracy = getAccuracy(result);

                  const score = Number(result?.score);

                  const responseTime = Number(result?.responseTime);

                  return (
                    <tr key={result?._id || result?.id || index}>
                      <td>{formatDate(getResultDate(result))}</td>

                      <td>{getValue(result, "level") ?? "—"}</td>

                      <td>{getValue(result, "totalAttempts") ?? "—"}</td>

                      <td>{getValue(result, "mistakes") ?? "—"}</td>

                      <td>
                        <span className="accuracy-value">
                          {accuracy !== null ? `${accuracy.toFixed(1)}%` : "—"}
                        </span>
                      </td>

                      <td>{Number.isFinite(score) ? score.toFixed(1) : "—"}</td>

                      <td>
                        {Number.isFinite(responseTime)
                          ? `${responseTime.toFixed(1)}s`
                          : "—"}
                      </td>

                      <td>
                        {getValue(result, "difficultyChange") ||
                          getValue(result, "difficulty") ||
                          "—"}
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
