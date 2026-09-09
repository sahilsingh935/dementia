import React, { useEffect, useState } from "react";

import {
  getPatients,
  getAnalytics,
  getUser,
  addPatient,
  logout,
} from "../services/api";

// ==========================================
// GAME NAMES
// Backend names same rahenge
// Sirf UI display names change honge
// ==========================================

const GAME_NAMES = {
  memory: "Match the Pairs",
  puzzle: "Pattern Completion",
  recallSequence: "Recall The Sequence",
  recognition: "Let's Remember",
  routine: "Odd One Out",
};

const GAME_KEYS = Object.keys(GAME_NAMES);

export default function CaretakerDashboard() {
  // ==========================================
  // STATE
  // ==========================================

  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddPatient, setShowAddPatient] = useState(false);

  const [search, setSearch] = useState("");

  // Add patient form
  const [patientName, setPatientName] = useState("");
  const [patientUsername, setPatientUsername] = useState("");
  const [patientPassword, setPatientPassword] = useState("");

  const [addingPatient, setAddingPatient] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const currentUser = getUser();

      setUser(currentUser);

      // ========================================
      // GET PATIENTS
      // ========================================

      const patientResponse = await getPatients();

      const patientList =
        patientResponse?.patients || patientResponse?.data || [];

      setPatients(patientList);

      // ========================================
      // GET ANALYTICS
      // ========================================

      try {
        const analyticsResponse = await getAnalytics();

        setAnalytics(analyticsResponse?.analytics || analyticsResponse || null);
      } catch (analyticsError) {
        console.error("Analytics error:", analyticsError);

        // Patients dashboard should still work
        setAnalytics(null);
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ADD PATIENT
  // ==========================================

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

      const response = await addPatient({
        name: patientName.trim(),
        username: patientUsername.trim(),
        password: patientPassword.trim(),
      });

      console.log("Patient created:", response);

      setSuccessMessage("Patient added successfully!");

      // Clear form
      setPatientName("");
      setPatientUsername("");
      setPatientPassword("");

      // Reload dashboard
      await loadDashboard();

      // Close modal
      setTimeout(() => {
        setShowAddPatient(false);
        setSuccessMessage("");
      }, 1000);
    } catch (err) {
      console.error("Add patient error:", err);

      setError(err.message || "Unable to add patient.");
    } finally {
      setAddingPatient(false);
    }
  }

  // ==========================================
  // SEARCH PATIENTS
  // ==========================================

  const filteredPatients = patients.filter((patient) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      patient.name?.toLowerCase().includes(searchText) ||
      patient.username?.toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // GET ALL GAME RESULTS
  // ==========================================

  function getAllGameResults() {
    if (!analytics) {
      return [];
    }

    const results = [];

    GAME_KEYS.forEach((game) => {
      if (Array.isArray(analytics[game])) {
        results.push(...analytics[game]);
      }
    });

    return results;
  }

  // ==========================================
  // CALCULATE GAME COUNT
  // ==========================================

  function getGameCount() {
    return getAllGameResults().length;
  }

  // ==========================================
  // CALCULATE AVERAGE PERFORMANCE
  // ==========================================

  function getAveragePerformance() {
    const allResults = getAllGameResults();

    if (allResults.length === 0) {
      return 0;
    }

    let total = 0;
    let validScores = 0;

    allResults.forEach((result) => {
      let performance = null;

      // Accuracy ko primary metric rakha hai
      if (
        result.accuracy !== undefined &&
        result.accuracy !== null &&
        !Number.isNaN(Number(result.accuracy))
      ) {
        performance = Number(result.accuracy);
      }
      // Agar accuracy nahi hai toh score
      else if (
        result.score !== undefined &&
        result.score !== null &&
        !Number.isNaN(Number(result.score))
      ) {
        performance = Number(result.score);
      }
      // Last fallback
      else if (
        result.percentage !== undefined &&
        result.percentage !== null &&
        !Number.isNaN(Number(result.percentage))
      ) {
        performance = Number(result.percentage);
      }

      if (performance !== null && Number.isFinite(performance)) {
        total += performance;
        validScores++;
      }
    });

    if (validScores === 0) {
      return 0;
    }

    return Math.round(total / validScores);
  }

  // ==========================================
  // GET PATIENT GAME COUNT
  // ==========================================

  function getPatientGameCount(patientId) {
    if (!analytics) {
      return 0;
    }

    let count = 0;

    GAME_KEYS.forEach((game) => {
      if (!Array.isArray(analytics[game])) {
        return;
      }

      count += analytics[game].filter((result) => {
        const resultPatientId = result.patientId?._id || result.patientId;

        return String(resultPatientId) === String(patientId);
      }).length;
    });

    return count;
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  function handleLogout() {
    logout();
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loader}>Loading dashboard...</div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div style={styles.page}>
      {/* ======================================
          NAVBAR
      ====================================== */}

      <header style={styles.navbar}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>M</div>

          <div>
            <h2 style={styles.logoText}>MANAS</h2>

            <span style={styles.logoSubtext}>Caretaker Dashboard</span>
          </div>
        </div>

        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {(user?.name || "C").charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={styles.userName}>{user?.name || "Caretaker"}</div>

              <div style={styles.userRole}>Caretaker</div>
            </div>
          </div>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main style={styles.container}>
        {/* HEADER */}

        <section style={styles.welcomeSection}>
          <div>
            <p style={styles.eyebrow}>CARETAKER PORTAL</p>

            <h1 style={styles.heading}>
              Welcome, {user?.name || "Caretaker"} 👋
            </h1>

            <p style={styles.description}>
              Monitor and support your patients' cognitive wellness.
            </p>
          </div>

          <button
            style={styles.addButton}
            onClick={() => {
              setError("");
              setSuccessMessage("");
              setShowAddPatient(true);
            }}
          >
            <span style={styles.plus}>+</span>
            Add Patient
          </button>
        </section>

        {/* ERROR */}

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* ====================================
            STATS
        ==================================== */}

        <section style={styles.statsGrid}>
          <StatCard title="Total Patients" value={patients.length} icon="👥" />

          <StatCard title="Games Completed" value={getGameCount()} icon="🎮" />

          <StatCard
            title="Average Performance"
            value={`${getAveragePerformance()}%`}
            icon="📈"
          />
        </section>

        {/* ====================================
            PATIENT SECTION
        ==================================== */}

        <section style={styles.patientSection}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Your Patients</h2>

              <p style={styles.sectionSubtitle}>
                Patients assigned to your caretaker account
              </p>
            </div>

            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>

              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* PATIENT CARDS */}

          {filteredPatients.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👤</div>

              <h3 style={styles.emptyTitle}>
                {patients.length === 0
                  ? "No patients added yet"
                  : "No patients found"}
              </h3>

              <p style={styles.emptyText}>
                {patients.length === 0
                  ? "Add your first patient to start monitoring their progress."
                  : "Try searching with a different name or username."}
              </p>

              {patients.length === 0 && (
                <button
                  style={styles.addButton}
                  onClick={() => {
                    setError("");
                    setShowAddPatient(true);
                  }}
                >
                  + Add Patient
                </button>
              )}
            </div>
          ) : (
            <div style={styles.patientGrid}>
              {filteredPatients.map((patient) => {
                const patientId = patient._id || patient.id;

                return (
                  <PatientCard
                    key={patientId}
                    patient={patient}
                    gameCount={getPatientGameCount(patientId)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ======================================
          ADD PATIENT MODAL
      ====================================== */}

      {showAddPatient && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddPatient(false);
              setError("");
            }
          }}
        >
          <div style={styles.modal}>
            {/* CLOSE */}

            <button
              style={styles.closeButton}
              onClick={() => {
                setShowAddPatient(false);
                setError("");
              }}
            >
              ×
            </button>

            <div style={styles.modalIcon}>👤</div>

            <h2 style={styles.modalTitle}>Add New Patient</h2>

            <p style={styles.modalSubtitle}>
              Create login credentials for your patient.
            </p>

            {/* SUCCESS */}

            {successMessage && (
              <div style={styles.successBox}>{successMessage}</div>
            )}

            {/* ERROR */}

            {error && <div style={styles.modalErrorBox}>{error}</div>}

            <form onSubmit={handleAddPatient}>
              {/* NAME */}

              <label style={styles.label}>Patient Name</label>

              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={styles.input}
              />

              {/* USERNAME */}

              <label style={styles.label}>Username</label>

              <input
                type="text"
                placeholder="Create username"
                value={patientUsername}
                onChange={(e) => setPatientUsername(e.target.value)}
                style={styles.input}
              />

              {/* PASSWORD */}

              <label style={styles.label}>Password</label>

              <input
                type="password"
                placeholder="Create password"
                value={patientPassword}
                onChange={(e) => setPatientPassword(e.target.value)}
                style={styles.input}
              />

              {/* BUTTON */}

              <button
                type="submit"
                style={{
                  ...styles.createButton,
                  opacity: addingPatient ? 0.7 : 1,
                  cursor: addingPatient ? "not-allowed" : "pointer",
                }}
                disabled={addingPatient}
              >
                {addingPatient ? "Creating Patient..." : "Create Patient"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ title, value, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>

      <div>
        <p style={styles.statTitle}>{title}</p>

        <h3 style={styles.statValue}>{value}</h3>
      </div>
    </div>
  );
}

// ==========================================
// PATIENT CARD
// ==========================================

function PatientCard({ patient, gameCount }) {
  const patientId = patient._id || patient.id;

  function openPatient() {
    window.location.href = `/caretaker/patient/${patientId}`;
  }

  return (
    <div style={styles.patientCard} onClick={openPatient}>
      <div style={styles.patientTop}>
        <div style={styles.patientAvatar}>
          {(patient.name || "P").charAt(0).toUpperCase()}
        </div>

        <div style={styles.patientInfo}>
          <h3 style={styles.patientName}>
            {patient.name || "Unnamed Patient"}
          </h3>

          <p style={styles.patientUsername}>@{patient.username || "unknown"}</p>
        </div>

        <span style={styles.arrow}>→</span>
      </div>

      <div style={styles.patientStats}>
        <div>
          <span style={styles.patientStatLabel}>Games</span>

          <strong style={styles.patientStatValue}>{gameCount}</strong>
        </div>

        <div>
          <span style={styles.patientStatLabel}>Status</span>

          <strong style={styles.activeStatus}>Active</strong>
        </div>
      </div>

      <div style={styles.viewDetails}>View Patient Details →</div>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f8f2 0%, #edf5ed 100%)",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#214f3b",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f8f2",
  },

  loader: {
    fontSize: "18px",
    color: "#214f3b",
    fontWeight: 600,
  },

  navbar: {
    height: "78px",
    background: "rgba(255,255,255,0.94)",
    borderBottom: "1px solid rgba(33,79,59,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 42px",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backdropFilter: "blur(12px)",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "#214f3b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "21px",
  },

  logoText: {
    margin: 0,
    fontSize: "21px",
    letterSpacing: "2px",
  },

  logoSubtext: {
    display: "block",
    fontSize: "11px",
    color: "#789080",
    marginTop: "2px",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#d9eadc",
    color: "#214f3b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  userName: {
    fontSize: "14px",
    fontWeight: 700,
  },

  userRole: {
    fontSize: "11px",
    color: "#789080",
    marginTop: "2px",
  },

  logoutButton: {
    border: "1px solid #d5dfd5",
    background: "#fff",
    color: "#214f3b",
    borderRadius: "10px",
    padding: "9px 17px",
    cursor: "pointer",
    fontWeight: 600,
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "42px 28px 70px",
  },

  welcomeSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    marginBottom: "30px",
  },

  eyebrow: {
    margin: "0 0 7px",
    fontSize: "11px",
    letterSpacing: "2px",
    fontWeight: 700,
    color: "#789080",
  },

  heading: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.15,
  },

  description: {
    margin: "9px 0 0",
    color: "#718178",
    fontSize: "15px",
  },

  addButton: {
    border: "none",
    background: "#214f3b",
    color: "#fff",
    borderRadius: "12px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 8px 20px rgba(33,79,59,0.16)",
  },

  plus: {
    fontSize: "20px",
    lineHeight: 1,
  },

  errorBox: {
    background: "#fff0ef",
    border: "1px solid #f1c7c3",
    color: "#a34239",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "35px",
  },

  statCard: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(33,79,59,0.08)",
    borderRadius: "18px",
    padding: "23px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
    boxShadow: "0 8px 25px rgba(33,79,59,0.06)",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#e4efe5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  statTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#789080",
    fontWeight: 600,
  },

  statValue: {
    margin: "4px 0 0",
    fontSize: "27px",
  },

  patientSection: {
    background: "rgba(255,255,255,0.7)",
    borderRadius: "22px",
    padding: "27px",
    border: "1px solid rgba(33,79,59,0.08)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#7a8880",
    fontSize: "13px",
  },

  searchWrapper: {
    position: "relative",
    width: "260px",
  },

  searchIcon: {
    position: "absolute",
    left: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce5dd",
    borderRadius: "11px",
    padding: "11px 13px 11px 38px",
    outline: "none",
    background: "#fff",
    fontSize: "13px",
  },

  patientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "17px",
  },

  patientCard: {
    background: "#fff",
    border: "1px solid #e0e8e1",
    borderRadius: "17px",
    padding: "19px",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  patientTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  patientAvatar: {
    width: "46px",
    height: "46px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#e1eee3",
    color: "#214f3b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "17px",
  },

  patientInfo: {
    minWidth: 0,
    flex: 1,
  },

  patientName: {
    margin: 0,
    fontSize: "16px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  patientUsername: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#839087",
  },

  arrow: {
    fontSize: "20px",
    color: "#79907f",
  },

  patientStats: {
    display: "flex",
    gap: "45px",
    marginTop: "21px",
    paddingTop: "15px",
    borderTop: "1px solid #edf1ed",
  },

  patientStatLabel: {
    display: "block",
    fontSize: "10px",
    color: "#87938b",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },

  patientStatValue: {
    fontSize: "15px",
  },

  activeStatus: {
    fontSize: "13px",
    color: "#4d8a5b",
  },

  viewDetails: {
    marginTop: "17px",
    fontSize: "12px",
    color: "#47745a",
    fontWeight: 700,
  },

  emptyState: {
    textAlign: "center",
    padding: "65px 20px",
  },

  emptyIcon: {
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    background: "#e7efe8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontSize: "27px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "18px",
  },

  emptyText: {
    color: "#7e8982",
    fontSize: "13px",
    maxWidth: "400px",
    margin: "8px auto 20px",
    lineHeight: 1.6,
  },

  // ========================================
  // MODAL
  // ========================================

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20,38,28,0.42)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 100,
  },

  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    background: "#fff",
    borderRadius: "22px",
    padding: "32px",
    boxSizing: "border-box",
    boxShadow: "0 25px 70px rgba(0,0,0,0.2)",
  },

  closeButton: {
    position: "absolute",
    right: "17px",
    top: "13px",
    border: "none",
    background: "transparent",
    fontSize: "27px",
    color: "#718178",
    cursor: "pointer",
  },

  modalIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "15px",
    background: "#e4efe5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "15px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "24px",
  },

  modalSubtitle: {
    margin: "7px 0 24px",
    color: "#7a8780",
    fontSize: "13px",
  },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#50645a",
    margin: "15px 0 7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce5dd",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    outline: "none",
  },

  createButton: {
    width: "100%",
    marginTop: "23px",
    border: "none",
    background: "#214f3b",
    color: "#fff",
    borderRadius: "11px",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 700,
  },

  successBox: {
    background: "#edf7ee",
    color: "#3d7747",
    border: "1px solid #cce2cf",
    borderRadius: "9px",
    padding: "10px 12px",
    fontSize: "13px",
    marginBottom: "12px",
  },

  modalErrorBox: {
    background: "#fff0ef",
    color: "#a34239",
    border: "1px solid #f1c7c3",
    borderRadius: "9px",
    padding: "10px 12px",
    fontSize: "13px",
    marginBottom: "12px",
  },
};
