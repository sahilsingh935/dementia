import React, { useEffect, useMemo, useState } from "react";
import {
  getPatients,
  getAnalytics,
  getUser,
  addPatient,
  logout,
} from "../services/api";
import "./CaretakerDashboard.css";

const GAME_NAMES = {
  memory: "Match the Pairs",
  puzzle: "Pattern Completion",
  recallSequence: "Recall The Sequence",
  recognition: "Let's Remember",
  routine: "Odd One Out",
};

const GAME_KEYS = Object.keys(GAME_NAMES);

export default function CaretakerDashboard() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientUsername, setPatientUsername] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [addingPatient, setAddingPatient] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const currentUser = getUser();
      setUser(currentUser);

      const patientResponse = await getPatients();
      const patientList =
        patientResponse?.patients || patientResponse?.data || [];
      setPatients(Array.isArray(patientList) ? patientList : []);

      try {
        const analyticsResponse = await getAnalytics();
        setAnalytics(
          analyticsResponse?.analytics || analyticsResponse || null
        );
      } catch (analyticsError) {
        console.error("Analytics error:", analyticsError);
        setAnalytics(null);
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPatient(e) {
    e.preventDefault();

    if (
      !patientName.trim() ||
      !patientUsername.trim() ||
      !patientPassword.trim()
    ) {
      setError("Please fill all patient fields.");
      return;
    }

    try {
      setAddingPatient(true);
      setError("");
      setSuccessMessage("");

      await addPatient({
        name: patientName.trim(),
        username: patientUsername.trim(),
        password: patientPassword.trim(),
      });

      setPatientName("");
      setPatientUsername("");
      setPatientPassword("");
      setSuccessMessage("Patient added successfully!");

      await loadDashboard();

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 2200);
    } catch (err) {
      console.error("Add patient error:", err);
      setError(err.message || "Unable to add patient.");
    } finally {
      setAddingPatient(false);
    }
  }

  function getAllGameResults() {
    if (!analytics) return [];

    const results = [];

    GAME_KEYS.forEach((game) => {
      if (Array.isArray(analytics[game])) {
        results.push(...analytics[game]);
      }
    });

    return results;
  }

  function getPerformanceValue(result) {
    if (
      result?.accuracy !== undefined &&
      result?.accuracy !== null &&
      !Number.isNaN(Number(result.accuracy))
    ) {
      return Number(result.accuracy);
    }

    if (
      result?.score !== undefined &&
      result?.score !== null &&
      !Number.isNaN(Number(result.score))
    ) {
      return Number(result.score);
    }

    if (
      result?.percentage !== undefined &&
      result?.percentage !== null &&
      !Number.isNaN(Number(result.percentage))
    ) {
      return Number(result.percentage);
    }

    return null;
  }

  function getGameCount() {
    return getAllGameResults().length;
  }

  function getAveragePerformance() {
    const values = getAllGameResults()
      .map(getPerformanceValue)
      .filter((value) => value !== null && Number.isFinite(value));

    if (!values.length) return 0;

    return Math.round(
      values.reduce((total, value) => total + value, 0) / values.length
    );
  }

  function getPatientGameCount(patientId) {
    return getAllGameResults().filter((result) => {
      const resultPatientId = result?.patientId?._id || result?.patientId;
      return String(resultPatientId) === String(patientId);
    }).length;
  }

  function getPatientPerformance(patientId) {
    const values = getAllGameResults()
      .filter((result) => {
        const resultPatientId = result?.patientId?._id || result?.patientId;
        return String(resultPatientId) === String(patientId);
      })
      .map(getPerformanceValue)
      .filter((value) => value !== null && Number.isFinite(value));

    if (!values.length) return null;

    return Math.round(
      values.reduce((total, value) => total + value, 0) / values.length
    );
  }

  const filteredPatients = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return patients;

    return patients.filter((patient) => {
      return (
        patient.name?.toLowerCase().startsWith(searchText) ||
        patient.username?.toLowerCase().startsWith(searchText)
      );
    });
  }, [patients, search]);

  const visiblePatients = patients.slice(0, 3);

  const leaderboard = useMemo(() => {
    return patients
      .map((patient) => {
        const patientId = patient._id || patient.id;
        const performance = getPatientPerformance(patientId);
        return {
          ...patient,
          patientId,
          performance: performance === null ? 0 : performance,
          gameCount: getPatientGameCount(patientId),
        };
      })
      .sort((a, b) => {
        if (b.performance !== a.performance) return b.performance - a.performance;
        return b.gameCount - a.gameCount;
      });
  }, [patients, analytics]);

  const podiumPatients = leaderboard.slice(0, 3);

  function handleLogout() {
    logout();
  }

  if (loading) {
    return (
      <div className="caretaker-loading">
        <div className="loading-card">
          <div className="loading-logo">M</div>
          <div className="loading-spinner" />
          <h2>Loading dashboard</h2>
          <p>Preparing your patient overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="caretaker-page">
      <header className="caretaker-navbar">
        <div className="brand-block">
          <div className="brand-logo"><img src="/manas-logo.png" alt="" /></div>
          <div>
            <div className="brand-name">MANAS</div>
            <div className="brand-subtitle">Caretaker Dashboard</div>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="caretaker-profile">
            <div className="profile-avatar">
              {(user?.name || "C").charAt(0).toUpperCase()}
            </div>
            <div className="profile-copy">
              <strong>{user?.name || "Caretaker"}</strong>
              <span>Caretaker</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-shell">
        <section className="dashboard-intro">
          <div>
            <p className="eyebrow">CARETAKER PORTAL</p>
            <h1>Welcome, {user?.name || "Caretaker"}</h1>
            <p>
              Monitor and support your patients&apos; cognitive wellness from
              one place.
            </p>
          </div>

          <div className="intro-badge">
            <span className="status-dot" />
            Dashboard Active
          </div>
        </section>

        {error && (
          <div className="dashboard-alert error-alert">
            <span>!</span>
            {error}
            <button onClick={() => setError("")} aria-label="Close error">
              ×
            </button>
          </div>
        )}

        <section className="stats-strip">
          <StatCard
            icon="👥"
            label="Total Patients"
            value={patients.length}
            detail="Currently assigned"
          />
          <StatCard
            icon="🎮"
            label="Games Completed"
            value={getGameCount()}
            detail="Across all patients"
          />
          <StatCard
            icon="📈"
            label="Average Performance"
            value={`${getAveragePerformance()}%`}
            detail="Based on game results"
          />
        </section>

        <section className="dashboard-grid">
          {/* LEFT — ADD PATIENT */}
          <section className="dashboard-panel add-panel">
            <div className="panel-heading">
              <div className="panel-icon add-icon">+</div>
              <div>
                <h2>Add New Patient</h2>
                <p>Create patient login credentials.</p>
              </div>
            </div>

            {successMessage && (
              <div className="dashboard-alert success-alert">
                <span>✓</span>
                {successMessage}
              </div>
            )}

            <form className="patient-form" onSubmit={handleAddPatient}>
              <label htmlFor="patient-name">Patient Name</label>
              <input
                id="patient-name"
                type="text"
                placeholder="Enter full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                autoComplete="off"
              />

              <label htmlFor="patient-username">Username</label>
              <input
                id="patient-username"
                type="text"
                placeholder="Create username"
                value={patientUsername}
                onChange={(e) => setPatientUsername(e.target.value)}
                autoComplete="off"
              />

              <label htmlFor="patient-password">Password</label>
              <input
                id="patient-password"
                type="password"
                placeholder="Create password"
                value={patientPassword}
                onChange={(e) => setPatientPassword(e.target.value)}
                autoComplete="new-password"
              />

              <button
                className="create-patient-button"
                type="submit"
                disabled={addingPatient}
              >
                {addingPatient ? (
                  <>
                    <span className="button-spinner" />
                    Creating Patient...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Create Patient
                  </>
                )}
              </button>
            </form>

            <div className="form-note">
              <span>🔒</span>
              Patient credentials are used to access their MANAS games.
            </div>
          </section>

          {/* MIDDLE — PATIENTS */}
          <section className="dashboard-panel patients-panel">
            <div className="panel-topline">
              <div className="panel-heading compact-heading">
                <div className="panel-icon patients-icon">👥</div>
                <div>
                  <h2>Your Patients</h2>
                  <p>Quick overview of your assigned patients.</p>
                </div>
              </div>

              {patients.length > 4 && (
                <button
                  className="view-all-button"
                  onClick={() => setShowAllPatients(true)}
                >
                  View All Patients <span>→</span>
                </button>
              )}
            </div>

            {patients.length === 0 ? (
              <div className="empty-patients">
                <div className="empty-patient-icon">👤</div>
                <h3>
                  {patients.length === 0
                    ? "No patients added yet"
                    : "No patients found"}
                </h3>
                <p>
                  {patients.length === 0
                    ? "Add your first patient using the form on the left."
                    : "Try a different name or username."}
                </p>
              </div>
            ) : (
              <>
                <div className="patient-grid">
                  {visiblePatients.map((patient) => {
                    const patientId = patient._id || patient.id;

                    return (
                      <PatientCard
                        key={patientId}
                        patient={patient}
                      />
                    );
                  })}
                </div>

                {patients.length > 3 && (
                  <button
                    className="bottom-view-all"
                    onClick={() => setShowAllPatients(true)}
                  >
                    View All Patients
                    <span>→</span>
                  </button>
                )}
              </>
            )}
          </section>

          {/* RIGHT — SEARCH + LEADERBOARD */}
          <aside className="right-column">
            <section className="dashboard-panel search-panel">
              <div className="search-heading">
                <div>
                  <p className="mini-label">PATIENT DIRECTORY</p>
                  <h2>Search Patients</h2>
                </div>
                <span className="search-count">{patients.length}</span>
              </div>

              <button
                type="button"
                className="patient-search search-launcher"
                onClick={() => {
                  setSearch("");
                  setShowSearchModal(true);
                }}
              >
                <span className="search-symbol">⌕</span>
                <span className="search-placeholder">Search patients...</span>
                <span className="search-launch-arrow">→</span>
              </button>
            </section>

            <section className="dashboard-panel leaderboard-panel">
              <div className="activity-leaderboard-header">
                <div>
                  <p className="mini-label">THIS WEEK</p>
                  <h2>ACTIVITY LEADERBOARD</h2>
                </div>
                {leaderboard.length > 3 && (
                  <button
                    className="leaderboard-view-all-link"
                    onClick={() => setShowLeaderboardModal(true)}
                  >
                    View All ›
                  </button>
                )}
              </div>

              {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                  <div>👥</div>
                  <strong>No patients yet</strong>
                  <span>Add a patient to start the leaderboard.</span>
                </div>
              ) : (
                <>
                  <div className="leaderboard-podium">
                    {podiumPatients.map((patient, index) => (
                      <PodiumPatient
                        key={patient.patientId}
                        patient={patient}
                        rank={index + 1}
                      />
                    ))}
                  </div>

                  {leaderboard.length > 3 && (
                    <button
                      className="leaderboard-bottom-view-all"
                      onClick={() => setShowLeaderboardModal(true)}
                    >
                      View All ›
                    </button>
                  )}
                </>
              )}
            </section>
          </aside>
        </section>
      </main>

      {showSearchModal && (
        <div
          className="patient-finder-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSearchModal(false);
              setSearch("");
            }
          }}
        >
          <div className="patient-finder-modal">
            <div className="finder-header">
              <div>
                <p className="mini-label">PATIENT FINDER</p>
                <h2>Find a Patient</h2>
                <p>Search by patient name or assigned username.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearch("");
                }}
                aria-label="Close patient finder"
              >
                ×
              </button>
            </div>

            <div className="finder-search">
              <span>⌕</span>
              <input
                autoFocus
                type="text"
                placeholder="Type a name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="finder-results">
              {filteredPatients.length === 0 ? (
                <div className="finder-empty">No matching patients found.</div>
              ) : (
                filteredPatients.map((patient) => {
                  const patientId = patient._id || patient.id;
                  return (
                    <button
                      key={patientId}
                      className="finder-patient-row"
                      onClick={() => {
                        window.location.href = `/caretaker/patient/${patientId}`;
                      }}
                    >
                      <div className="finder-avatar">
                        {(patient.name || "P").charAt(0).toUpperCase()}
                      </div>
                      <div className="finder-patient-copy">
                        <strong>{patient.name || "Unnamed Patient"}</strong>
                        <span>@{patient.username || "unknown"}</span>
                      </div>
                      <span className="finder-arrow">›</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showLeaderboardModal && (
        <div
          className="all-patients-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLeaderboardModal(false);
          }}
        >
          <div className="all-patients-modal leaderboard-modal">
            <div className="modal-header">
              <div>
                <p className="mini-label">ACTIVITY LEADERBOARD</p>
                <h2>All Patients</h2>
                <p>Every assigned patient is ranked, including zero-score patients.</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowLeaderboardModal(false)}
                aria-label="Close leaderboard"
              >
                ×
              </button>
            </div>

            <div className="leaderboard-modal-list">
              {leaderboard.map((patient, index) => (
                <LeaderboardRow
                  key={patient.patientId}
                  patient={patient}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showAllPatients && (
        <div
          className="all-patients-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAllPatients(false);
            }
          }}
        >
          <div className="all-patients-modal">
            <div className="modal-header">
              <div>
                <p className="mini-label">PATIENT DIRECTORY</p>
                <h2>All Patients</h2>
                <p>{patients.length} patient(s) connected to this caretaker account</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowAllPatients(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="all-patients-grid">
              {patients.map((patient) => {
                const patientId = patient._id || patient.id;

                return (
                  <PatientCard
                        key={patientId}
                        patient={patient}
                      />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function PatientCard({ patient }) {
  const patientId = patient._id || patient.id;

  function openPatient() {
    window.location.href = `/caretaker/patient/${patientId}`;
  }

  return (
    <button className="patient-card patient-card-simple" onClick={openPatient}>
      <div className="patient-card-top">
        <div className="patient-avatar">
          {(patient.name || "P").charAt(0).toUpperCase()}
        </div>

        <div className="patient-copy">
          <h3>{patient.name || "Unnamed Patient"}</h3>
          <p>@{patient.username || "unknown"}</p>
        </div>

        <span className="details-link">View Details →</span>
      </div>
    </button>
  );
}

function PodiumPatient({ patient, rank }) {
  return (
    <button
      className={`podium-person podium-rank-${rank}`}
      onClick={() => {
        window.location.href = `/caretaker/patient/${patient.patientId}`;
      }}
    >
      <div className="podium-avatar-wrap">
        <div className="podium-avatar">
          {(patient.name || "P").charAt(0).toUpperCase()}
        </div>
        <span className="podium-rank-badge">{rank}</span>
      </div>

      <strong>{patient.name || "Unnamed Patient"}</strong>
      <span>{patient.gameCount} game{patient.gameCount === 1 ? "" : "s"} · {patient.performance}%</span>

      <div className="podium-block">
        <b>{rank}</b>
        <small>{rank === 1 ? "TOP" : rank === 2 ? "2ND" : "3RD"}</small>
      </div>
    </button>
  );
}

function LeaderboardRow({ patient, rank }) {
  return (
    <button
      className="leaderboard-row"
      onClick={() => {
        window.location.href = `/caretaker/patient/${patient.patientId}`;
      }}
    >
      <div className={`rank rank-${rank}`}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
      </div>

      <div className="leaderboard-avatar">
        {(patient.name || "P").charAt(0).toUpperCase()}
      </div>

      <div className="leaderboard-copy">
        <strong>{patient.name || "Unnamed Patient"}</strong>
        <span>{patient.gameCount} games completed</span>
      </div>

      <div className="leaderboard-score">{patient.performance ?? 0}%</div>
    </button>
  );
}