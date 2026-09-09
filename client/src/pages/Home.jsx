import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  const [showAuth, setShowAuth] = useState(false);
  const [selectedRole, setSelectedRole] = useState("patient");
  const [authMode, setAuthMode] = useState("login");

  const [patientId, setPatientId] = useState("");
  const [patientPassword, setPatientPassword] = useState("");

  const [caretakerEmail, setCaretakerEmail] = useState("");
  const [caretakerPassword, setCaretakerPassword] = useState("");

  const [caretakerName, setCaretakerName] = useState("");
  const [caretakerSignupEmail, setCaretakerSignupEmail] = useState("");
  const [caretakerSignupPassword, setCaretakerSignupPassword] = useState("");
  const [caretakerTerms, setCaretakerTerms] = useState(false);

  const [showPatientPassword, setShowPatientPassword] = useState(false);

  const [showCaretakerPassword, setShowCaretakerPassword] = useState(false);

  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [toast, setToast] = useState("");

  // ==========================================
  // OPEN AUTH MODAL
  // ==========================================

  function openAuth(role) {
    setSelectedRole(role);
    setAuthMode("login");
    setShowAuth(true);
  }

  // ==========================================
  // CLOSE AUTH MODAL
  // ==========================================

  function closeAuth() {
    setShowAuth(false);
  }

  // ==========================================
  // TOAST
  // ==========================================

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  }

  // ==========================================
  // PATIENT LOGIN
  // ==========================================

  function handlePatientLogin(e) {
    e.preventDefault();

    const userId = patientId.trim();
    const password = patientPassword.trim();

    if (!userId || !password) {
      showToast("Please enter your User ID and password.");
      return;
    }

    const storedPatients = JSON.parse(
      localStorage.getItem("manasPatients") || "[]",
    );

    const matchedPatient = storedPatients.find(
      (patient) => patient.id === userId,
    );

    localStorage.setItem("manasRole", "patient");

    localStorage.setItem(
      "manasUser",
      matchedPatient ? matchedPatient.name : userId,
    );

    localStorage.setItem("manasUserId", userId);

    localStorage.setItem(
      "manasAge",
      matchedPatient ? matchedPatient.age : "65",
    );

    localStorage.setItem(
      "manasMobile",
      matchedPatient ? matchedPatient.mobile : "+91 98765 43210",
    );

    showToast("Login successful!");

    setTimeout(() => {
      navigate("/patient");
    }, 700);
  }

  // ==========================================
  // CARETAKER LOGIN
  // ==========================================

  function handleCaretakerLogin(e) {
    e.preventDefault();

    const email = caretakerEmail.trim();

    const password = caretakerPassword.trim();

    if (!email || !password) {
      showToast("Please enter your email/phone and password.");
      return;
    }

    localStorage.setItem("manasRole", "caretaker");

    localStorage.setItem("manasUser", email);

    showToast("Login successful!");

    setTimeout(() => {
      navigate("/patient");
    }, 700);
  }

  // ==========================================
  // CARETAKER SIGN UP
  // ==========================================

  function handleCaretakerSignup(e) {
    e.preventDefault();

    const name = caretakerName.trim();

    const email = caretakerSignupEmail.trim();

    const password = caretakerSignupPassword.trim();

    if (!name || !email || !password) {
      showToast("Please fill all the fields.");
      return;
    }

    if (!caretakerTerms) {
      showToast("Please accept the Terms & Conditions.");
      return;
    }

    localStorage.setItem("caretakerName", name);

    localStorage.setItem("caretakerEmail", email);

    showToast("Account created successfully!");

    setTimeout(() => {
      setAuthMode("login");
    }, 800);
  }

  // ==========================================
  // BACKDROP CLICK
  // ==========================================

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      closeAuth();
    }
  }

  // ==========================================
  // SLIDESHOW
  // ==========================================

  const images = [
    "/assets/login-bg/image1.jpg",
    "/assets/login-bg/image2.jpg",
    "/assets/login-bg/image3.jpg",
    "/assets/login-bg/image4.jpg",
    "/assets/login-bg/image5.jpg",
    "/assets/login-bg/image6.jpg",
    "/assets/login-bg/image7.jpg",
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page">
      {/* ==========================================
          MAIN ROLE SCREEN
      ========================================== */}

      <main className="role-screen">
        {/* ========================================
            LEFT HERO
        ======================================== */}

        <section className="role-hero">
          <div className="role-hero-content">
            {/* BRAND */}

            <div className="brand brand-large">
              <img
                src="/manas-logo.png"
                className="brand-logo-img"
                alt="MANAS Logo"
              />

              <span>
                <strong>MANAS</strong>

                <small>Play for a Better You</small>
              </span>
            </div>

            {/* EYEBROW */}

            <p className="eyebrow">A GENTLE SPACE FOR WELLNESS</p>

            {/* HEADING */}

            <h1>
              A healthier mind
              <br />
              for a brighter <span className="tomorrow">tomorrow</span>
            </h1>

            {/* LEAD */}

            <p className="hero-lead">Play • Practice • Feel Better</p>

            {/* ROLE QUESTION */}

            <p
              className="role-prompt"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: "25px",
                fontWeight: 700,
                color: "#214f3b",
                lineHeight: 1.15,
                margin: "22px 0 14px",
              }}
            >
              Who is joining MANAS today?
            </p>

            {/* ROLE BUTTONS */}

            <div className="role-buttons">
              {/* PATIENT */}

              <button
                className="role-card patient-role"
                type="button"
                onClick={() => openAuth("patient")}
              >
                <span className="role-icon">
                  <div className="role-icon patient-icon">
                    <img src="/src/assets/icons/patient.png" alt="Patient" />
                  </div>
                </span>

                <span className="role-text">
                  <strong>Patient</strong>

                  <small>Play games &amp; build healthy habits</small>
                </span>

                <b>→</b>
              </button>

              {/* CARETAKER */}

              <button
                className="role-card caretaker-role"
                type="button"
                onClick={() => openAuth("caretaker")}
              >
                <span className="role-icon">
                  <div className="role-icon caretaker-icon">
                    <img
                      src="/src/assets/icons/caretaker.png"
                      alt="Caretaker"
                    />
                  </div>
                </span>

                <span className="role-text">
                  <strong>Caretaker</strong>

                  <small>Support and track a loved one's progress</small>
                </span>

                <b>→</b>
              </button>
            </div>

            {/* QUOTE */}

            <p className="role-quote">“Small steps. Brighter days.”</p>

            {/* MOBILE ART */}

            <section
              className="mobile-art-card"
              aria-label="Inspired by the quiet beauty of Northeast India"
            >
              {images.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={index === 0 ? "Peaceful Northeast India landscape" : ""}
                  className={`mobile-art-slide ${
                    currentSlide === index ? "active" : ""
                  }`}
                />
              ))}

              <p>Inspired by the quiet beauty of Northeast India</p>
            </section>
          </div>
        </section>

        {/* ========================================
            RIGHT IMAGE
        ======================================== */}

        <div className="role-art-strip">
          <img src="/couple.png" alt="Elderly couple enjoying SmritiSetu" />
        </div>
      </main>

      {/* ==========================================
          AUTH MODAL
      ========================================== */}

      {showAuth && (
        <div
          id="authModal"
          className="modal-backdrop"
          onClick={handleBackdropClick}
        >
          <section className="auth-modal card" role="dialog" aria-modal="true">
            {/* CLOSE */}

            <button
              className="modal-close"
              type="button"
              aria-label="Close"
              onClick={closeAuth}
            >
              ×
            </button>

            {/* ====================================
                AUTH IMAGE
            ==================================== */}

            <div className="auth-art-pane">
              <div className="auth-art">
                <div className="auth-art-slideshow">
                  {images.map((image, index) => (
                    <img
                      key={image}
                      src={image}
                      alt=""
                      className={`auth-art-slide ${
                        currentSlide === index ? "active" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ====================================
                AUTH FORM
            ==================================== */}

            <div
              className={`auth-form-pane ${
                selectedRole === "caretaker" ? "caretaker-auth" : "patient-auth"
              }`}
            >
              {/* ROLE PILL */}

              <div className="auth-role-pill">
                {selectedRole === "patient"
                  ? "PATIENT LOGIN"
                  : authMode === "login"
                    ? "CARETAKER LOGIN"
                    : "CARETAKER SIGN UP"}
              </div>

              {/* HEADING */}

              <header className="auth-heading">
                <h2>
                  {selectedRole === "patient"
                    ? "Welcome back"
                    : authMode === "login"
                      ? "Welcome back"
                      : "Create your account"}
                </h2>

                <p>
                  {selectedRole === "patient"
                    ? "We're happy to see you today."
                    : authMode === "login"
                      ? "Support your loved one's journey."
                      : "Start supporting your loved one's journey."}
                </p>
              </header>

              {/* ==================================
                  PATIENT AUTH
              ================================== */}

              {selectedRole === "patient" && (
                <div className="auth-role-view">
                  <form onSubmit={handlePatientLogin}>
                    <label className="field">
                      <span className="field-icon">ID</span>

                      <input
                        type="text"
                        placeholder="User ID"
                        autoComplete="username"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span className="field-icon">⌑</span>

                      <input
                        type={showPatientPassword ? "text" : "password"}
                        placeholder="Password"
                        autoComplete="current-password"
                        value={patientPassword}
                        onChange={(e) => setPatientPassword(e.target.value)}
                      />

                      <button
                        className="password-toggle"
                        type="button"
                        onClick={() => setShowPatientPassword((prev) => !prev)}
                      >
                        ◉
                      </button>
                    </label>

                    <button className="primary-btn full-btn" type="submit">
                      Login
                      <span>→</span>
                    </button>

                    <p className="login-note">
                      Your caretaker can provide your MANAS User ID and
                      password.
                    </p>
                  </form>
                </div>
              )}

              {/* ==================================
                  CARETAKER AUTH
              ================================== */}

              {selectedRole === "caretaker" && (
                <div className="auth-role-view">
                  {/* TABS */}

                  <div className="auth-tabs">
                    <button
                      className={`auth-tab ${
                        authMode === "login" ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => setAuthMode("login")}
                    >
                      Login
                    </button>

                    <button
                      className={`auth-tab ${
                        authMode === "signup" ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => setAuthMode("signup")}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* ==================================
                      LOGIN
                  ================================== */}

                  {authMode === "login" && (
                    <div>
                      <form onSubmit={handleCaretakerLogin}>
                        <label className="field">
                          <span className="field-icon">@</span>

                          <input
                            type="text"
                            placeholder="Email or Phone Number"
                            autoComplete="username"
                            value={caretakerEmail}
                            onChange={(e) => setCaretakerEmail(e.target.value)}
                          />
                        </label>

                        <label className="field">
                          <span className="field-icon">⌑</span>

                          <input
                            type={showCaretakerPassword ? "text" : "password"}
                            placeholder="Password"
                            autoComplete="current-password"
                            value={caretakerPassword}
                            onChange={(e) =>
                              setCaretakerPassword(e.target.value)
                            }
                          />

                          <button
                            className="password-toggle"
                            type="button"
                            onClick={() =>
                              setShowCaretakerPassword((prev) => !prev)
                            }
                          >
                            ◉
                          </button>
                        </label>

                        <button className="primary-btn full-btn" type="submit">
                          Login
                          <span>→</span>
                        </button>
                      </form>

                      <p className="switch-copy">
                        Don’t have an account?{" "}
                        <button
                          className="text-link"
                          type="button"
                          onClick={() => setAuthMode("signup")}
                        >
                          Sign Up
                        </button>
                      </p>
                    </div>
                  )}

                  {/* ==================================
                      SIGNUP
                  ================================== */}

                  {authMode === "signup" && (
                    <div>
                      <form onSubmit={handleCaretakerSignup}>
                        <label className="field">
                          <span className="field-icon">A</span>

                          <input
                            type="text"
                            placeholder="Full Name"
                            value={caretakerName}
                            onChange={(e) => setCaretakerName(e.target.value)}
                          />
                        </label>

                        <label className="field">
                          <span className="field-icon">@</span>

                          <input
                            type="email"
                            placeholder="Email Address"
                            value={caretakerSignupEmail}
                            onChange={(e) =>
                              setCaretakerSignupEmail(e.target.value)
                            }
                          />
                        </label>

                        <label className="field">
                          <span className="field-icon">⌑</span>

                          <input
                            type={showSignupPassword ? "text" : "password"}
                            placeholder="Create Password"
                            value={caretakerSignupPassword}
                            onChange={(e) =>
                              setCaretakerSignupPassword(e.target.value)
                            }
                          />

                          <button
                            className="password-toggle"
                            type="button"
                            onClick={() =>
                              setShowSignupPassword((prev) => !prev)
                            }
                          >
                            ◉
                          </button>
                        </label>

                        <label className="terms-check">
                          <input
                            type="checkbox"
                            checked={caretakerTerms}
                            onChange={(e) =>
                              setCaretakerTerms(e.target.checked)
                            }
                          />

                          <span>I agree to the Terms &amp; Conditions</span>
                        </label>

                        <button className="primary-btn full-btn" type="submit">
                          Create Account
                          <span>→</span>
                        </button>
                      </form>

                      <p className="switch-copy">
                        Already have an account?{" "}
                        <button
                          className="text-link"
                          type="button"
                          onClick={() => setAuthMode("login")}
                        >
                          Login
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ==========================================
          TOAST
      ========================================== */}

      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
