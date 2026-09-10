import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage, LANGUAGES } from "../i18n/LanguageContext";
import VoiceButton from "../components/VoiceButton";
import "./PatientHome.css";

// =========================
// AUTH HELPERS
// =========================

function getPatientAuth() {
  return {
    token:
      localStorage.getItem("manasToken") ||
      sessionStorage.getItem("manasToken") ||
      null,

    role:
      localStorage.getItem("manasRole") ||
      sessionStorage.getItem("manasRole") ||
      null,

    userId:
      localStorage.getItem("manasUserId") ||
      sessionStorage.getItem("manasUserId") ||
      null,

    name:
      localStorage.getItem("manasUser") ||
      sessionStorage.getItem("manasUser") ||
      null,
  };
}

// =========================
// STATES
// =========================

const STATES = [
  {
    code: "Assam",
    name: "Assam",
    nativeName: "অসম",
  },
  {
    code: "Arunachal-Pradesh",
    name: "Arunachal Pradesh",
    nativeName: "अरुणाचल प्रदेश",
  },
  {
    code: "Manipur",
    name: "Manipur",
    nativeName: "মণিপুর",
  },
  {
    code: "Meghalaya",
    name: "Meghalaya",
    nativeName: "Meghalaya",
  },
  {
    code: "Mizoram",
    name: "Mizoram",
    nativeName: "Mizoram",
  },
  {
    code: "Nagaland",
    name: "Nagaland",
    nativeName: "Nagaland",
  },
  {
    code: "Sikkim",
    name: "Sikkim",
    nativeName: "Sikkim",
  },
  {
    code: "Tripura",
    name: "Tripura",
    nativeName: "ত্রিপুরা",
  },
];

// =========================
// GAMES
// =========================

const gameConfig = [
  {
    id: "memory",
    name: "Match The Pairs",
    description: "Train your memory, one step at a time!",
    icon: "✣",
    type: "memory",
    path: "/games/memory",
  },
  {
    id: "routine",
    name: "Odd One Out",
    description: "Improve attention by spotting what is different.",
    icon: "+−\n×÷",
    type: "routine",
    path: "/games/routine",
  },
  {
    id: "attention",
    name: "Pattern Recognition",
    description: "Strengthen reasoning with simple visual patterns.",
    icon: "▦",
    type: "attention",
    path: "/games/attention",
  },
  {
    id: "recognition",
    name: "Let's Remember",
    description: "Exercise recall and keep important details fresh.",
    icon: "♧",
    type: "recognition",
    path: "/games/recognition",
  },
  {
    id: "recall",
    name: "Recall the Sequence",
    description: "Build concentration by remembering the order of symbols.",
    icon: "1 2\n3 4",
    type: "recall-sequence",
    path: "/games/memory/recall-sequence",
  },
];

// =========================
// THOUGHTS
// =========================

const thoughts = [
  "Small steps. Brighter days.",
  "A healthier mind leads to a happier you.",
  "Take your time. You are doing great.",
  "Every day is a new opportunity to learn.",
  "Keep practicing. You are making progress.",
  "One step at a time is still progress.",
  "Believe in yourself and keep going.",
];

// =========================
// DEFAULT REMINDERS
// =========================

const defaultReminders = [
  {
    id: Date.now(),
    title: "Morning Medicine",
    time: "9:00 AM",
    done: false,
  },
  {
    id: Date.now() + 1,
    title: "Drink some water",
    time: "11:00 AM",
    done: false,
  },
  {
    id: Date.now() + 2,
    title: "Afternoon Walk",
    time: "4:00 PM",
    done: false,
  },
];

// =========================
// TIME
// =========================

const getTimeData = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good Morning!",
      greetingKey: "goodMorning",
      background: "/background-bg.png",
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good Afternoon!",
      greetingKey: "goodAfternoon",
      background: "/background-bg.png",
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good Evening!",
      greetingKey: "goodEvening",
      background: "/background1-bg.png",
    };
  }

  return {
    greeting: "Good Night!",
    greetingKey: "goodNight",
    background: "/background1-bg.png",
  };
};

// =========================
// DAILY THOUGHT
// =========================

function getDailyThought() {
  const today = new Date();

  const dateNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000,
  );

  return thoughts[Math.abs(dateNumber) % thoughts.length];
}

// =========================
// PATIENT HOME
// =========================

function PatientHome() {
  const navigate = useNavigate();

  const [timeData, setTimeData] = useState(getTimeData());

  const [selectedGame, setSelectedGame] = useState("");

  const [reminders, setReminders] = useState([]);

  const [patientName, setPatientName] = useState("Guest User");

  const { language, setLanguage, t } = useLanguage();

  // Translated games are rebuilt whenever the selected language changes.
  const games = gameConfig.map((game) => {
    const translationKey =
      game.id === "attention"
        ? "puzzle"
        : game.id === "recall"
          ? "recall"
          : game.id;

    return {
      ...game,
      name: t(`home.${translationKey}`),
      description: t(`${translationKey}.instruction`),
    };
  });

  // NEW — selected state
  const [selectedState, setSelectedState] = useState("Assam");

  const [recommendedGame, setRecommendedGame] = useState(null);

  const activeRecommendedGame =
    recommendedGame || games[0];

  const [showLanguage, setShowLanguage] = useState(false);

  // NEW — state dropdown
  const [showState, setShowState] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [showReminders, setShowReminders] = useState(false);

  const [showAddReminder, setShowAddReminder] = useState(false);

  const [newReminderTitle, setNewReminderTitle] = useState("");

  const [newReminderTime, setNewReminderTime] = useState("");

  const [dailyThought, setDailyThought] = useState(getDailyThought());



  // =========================
  // PATIENT DATA
  // =========================

  useEffect(() => {
    const auth = getPatientAuth();

    // Patient dashboard should only be used by a logged-in patient.
    if (!auth.token || auth.role !== "patient") {
      navigate("/");
      return;
    }

    if (auth.name) {
      setPatientName(auth.name);
    } else {
      const fallbackName =
        localStorage.getItem("patientName") ||
        sessionStorage.getItem("patientName");

      if (fallbackName) {
        setPatientName(fallbackName);
      }
    }

    // STATE
    const savedState =
      localStorage.getItem("manasState") ||
      sessionStorage.getItem("manasState");

    if (savedState) {
      const stateExists = STATES.some((state) => state.code === savedState);

      if (stateExists) {
        setSelectedState(savedState);
      } else {
        setSelectedState("Assam");
      }
    }

    // REMINDERS
    const savedReminders =
      localStorage.getItem("manasReminders") ||
      sessionStorage.getItem("manasReminders");

    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);

        setReminders(Array.isArray(parsed) ? parsed : defaultReminders);
      } catch {
        setReminders(defaultReminders);
      }
    } else {
      setReminders(defaultReminders);
    }
  }, [navigate]);

  // =========================
  // SAVE REMINDERS
  // =========================

  useEffect(() => {
    const auth = getPatientAuth();

    if (!auth.token || auth.role !== "patient") return;

    const storage = localStorage.getItem("manasToken")
      ? localStorage
      : sessionStorage;

    storage.setItem("manasReminders", JSON.stringify(reminders));
  }, [reminders]);

  // =========================
  // TIME UPDATE
  // =========================

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeData(getTimeData());
      setDailyThought(getDailyThought());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // =========================
  // ML RECOMMENDATION
  // =========================

  useEffect(() => {
    loadRecommendation();
  }, []);

  async function loadRecommendation() {
    try {
      const userId = localStorage.getItem("manasUserId");

      const response = await fetch(
        "http://localhost:5000/api/recommendation/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Recommendation API failed");
      }

      const data = await response.json();

      const recommendation =
        data.recommendedGame || data.recommendation || data.game;

      if (recommendation) {
        const foundGame = games.find(
          (game) =>
            game.id.toLowerCase() === String(recommendation).toLowerCase() ||
            game.name.toLowerCase() === String(recommendation).toLowerCase() ||
            game.type.toLowerCase() === String(recommendation).toLowerCase(),
        );

        if (foundGame) {
          setRecommendedGame(foundGame);
          setSelectedGame(foundGame);
          return;
        }
      }

      useLocalWeakestGame();
    } catch (error) {
      console.log("Recommendation API unavailable. Using local fallback.");

      useLocalWeakestGame();
    }
  }

  // =========================
  // LOCAL FALLBACK
  // =========================

  function useLocalWeakestGame() {
    const storedResults = [];

    const keys = [
      "gameResults",
      "memoryResults",
      "routineResults",
      "recognitionResults",
      "recallSequenceResults",
      "attentionResults",
    ];

    keys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");

        if (Array.isArray(data)) {
          storedResults.push(...data);
        }
      } catch {
        // ignore invalid local data
      }
    });

    if (storedResults.length === 0) {
      setRecommendedGame(games[0]);
      return;
    }

    const scores = {};

    games.forEach((game) => {
      scores[game.id] = [];
    });

    storedResults.forEach((result) => {
      const gameType = result.gameType || result.type || result.game;

      const game = games.find(
        (item) => item.id === gameType || item.type === gameType,
      );

      if (!game) return;

      let accuracy = Number(result.accuracy);

      if (Number.isNaN(accuracy)) {
        if (result.correctAttempts !== undefined && result.totalAttempts) {
          accuracy =
            (Number(result.correctAttempts) / Number(result.totalAttempts)) *
            100;
        }
      }

      if (!Number.isNaN(accuracy)) {
        scores[game.id].push(accuracy);
      }
    });

    let weakestGame = games[0];
    let weakestScore = Infinity;

    games.forEach((game) => {
      if (scores[game.id].length === 0) {
        return;
      }

      const average =
        scores[game.id].reduce((sum, value) => sum + value, 0) /
        scores[game.id].length;

      if (average < weakestScore) {
        weakestScore = average;
        weakestGame = game;
      }
    });

    setRecommendedGame(weakestGame);
  }

  // =========================
  // GAME
  // =========================

  function handleGameClick(game) {
    setSelectedGame(game);
    navigate(game.path);
  }

  function handlePlayNow() {
    navigate(activeRecommendedGame.path);
  }

  // =========================
  // REMINDERS
  // =========================

  function toggleReminder(id) {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              done: !reminder.done,
            }
          : reminder,
      ),
    );
  }

  function addReminder() {
    if (!newReminderTitle.trim()) return;

    const newReminder = {
      id: Date.now(),
      title: newReminderTitle.trim(),
      time: newReminderTime || "Anytime",
      done: false,
    };

    setReminders((prev) => [...prev, newReminder]);

    setNewReminderTitle("");
    setNewReminderTime("");
    setShowAddReminder(false);
  }

  function deleteReminder(id) {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  }

  // =========================
  // STATE
  // =========================

  function changeState(value) {
    setSelectedState(value);

    const storage = localStorage.getItem("manasToken")
      ? localStorage
      : sessionStorage;

    storage.setItem("manasState", value);

    setShowState(false);
  }

  const selectedStateName =
    STATES.find((state) => state.code === selectedState)?.name || "Assam";

  // =========================
  // LOGOUT
  // =========================

  function handleLogout() {
    [
      "manasToken",
      "manasRole",
      "manasUser",
      "manasUserId",
      "manasAge",
      "manasMobile",
      "manasState",
    ].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/");
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        {/* ================= TOPBAR ================= */}

        <header className="topbar card">
          <button className="brand" onClick={() => navigate("/patient")}>
            <img src="/manas-logo.png" className="brand-logo-img" alt="MANAS" />

            <span>
              <strong>MANAS</strong>
              <small>Play for a Better You</small>
            </span>
          </button>

          <nav className="top-actions">
            {/* HOME */}

            <button className="header-nav" onClick={() => navigate("/patient")}>
              <span>⌂</span>
              HOME
            </button>

            {/* LANGUAGE */}

            <div className="menu-wrap language-menu-wrap">
              <button
                className={`header-nav language-nav ${
                  showLanguage ? "language-nav-active" : ""
                }`}
                onClick={() => {
                  setShowLanguage((prev) => !prev);
                  setShowState(false);
                }}
                aria-label={t("common.language")}
              >
                <span>🌐</span>
                <span>
                  {LANGUAGES.find(
                    (item) => item.code === language
                  )?.nativeName || "English"}
                </span>
                <span className={`language-arrow ${showLanguage ? "open" : ""}`}>
                  ▾
                </span>
              </button>

              {showLanguage && (
                <div className="floating-menu language-menu">
                  <div className="language-menu-header">
                    <span className="language-menu-icon">🌐</span>
                    <div>
                      <strong>{t("common.language")}</strong>
                      <small>Choose your language</small>
                    </div>
                  </div>

                  <div className="language-options">
                    {LANGUAGES.map((item) => (
                      <button
                        key={item.code}
                        className={
                          language === item.code
                            ? "active-language"
                            : ""
                        }
                        onClick={() => {
                          setLanguage(item.code);
                          setShowLanguage(false);
                        }}
                      >
                        <span className="language-option-icon">
                          {language === item.code ? "✓" : "🌐"}
                        </span>

                        <span className="language-option-content">
                          <span className="language-native">
                            {item.nativeName}
                          </span>
                          <small>{item.name}</small>
                        </span>

                        {language === item.code && (
                          <span className="selected-dot">●</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STATE */}

            <div className="menu-wrap state-menu-wrap">
              <button
                className={`header-nav state-nav ${
                  showState ? "state-nav-active" : ""
                }`}
                onClick={() => {
                  setShowState((prev) => !prev);
                  setShowLanguage(false);
                }}
              >
                <span className="state-nav-icon">⌖</span>

                <span className="state-nav-text">{selectedStateName}</span>

                <span className={`state-arrow ${showState ? "open" : ""}`}>
                  ▾
                </span>
              </button>

              {showState && (
                <div className="floating-menu state-menu">
                  <div className="state-menu-header">
                    <span className="state-menu-icon">⌖</span>

                    <div>
                      <strong>{t("home.selectState")}</strong>
                      <small>{t("home.chooseRegion")}</small>
                    </div>
                  </div>

                  <div className="state-options">
                    {STATES.map((state) => (
                      <button
                        key={state.code}
                        className={
                          selectedState === state.code ? "active-state" : ""
                        }
                        onClick={() => changeState(state.code)}
                      >
                        <span className="state-option-icon">
                          {selectedState === state.code ? "✓" : "⌖"}
                        </span>

                        <span className="state-option-content">
                          <span className="state-native">
                            {state.nativeName}
                          </span>

                          <small>{state.name}</small>
                        </span>

                        {selectedState === state.code && (
                          <span className="selected-dot">●</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}

            <div className="menu-wrap">
              <button
                className="header-nav"
                onClick={() => setShowProfile(true)}
              >
                <span>♙</span>
                PROFILE
              </button>
            </div>
          </nav>
        </header>

        {/* ================= DASHBOARD ================= */}

        <main className="dashboard-grid">
          {/* ================= GAMES ================= */}

          <section className="game-panel card">
            <div className="section-heading">
              <h2>{t("home.games")}</h2>

              <span className="game-count">5 {t("home.gameWord")}</span>
            </div>

            <div className="game-list">
              {games.map((game) => (
                <button
                  key={game.id}
                  className={`game-card ${
                    selectedGame.id === game.id ? "selected" : ""
                  }`}
                  onClick={() => handleGameClick(game)}
                >
                  <span
                    className={`game-icon ${
                      game.id === "memory"
                        ? "lavender-icon"
                        : game.id === "routine"
                          ? "mint-icon"
                          : game.id === "attention"
                            ? "yellow-icon"
                            : game.id === "recognition"
                              ? "pink-icon"
                              : "blue-icon"
                    }`}
                  >
                    {game.icon.split("\n").map((line, index) => (
                      <span key={index}>
                        {line}

                        {index === 0 && game.icon.includes("\n") ? (
                          <br />
                        ) : null}
                      </span>
                    ))}
                  </span>

                  <span className="game-title">
                    {game.name.split(" ").map((word, index) => (
                      <span key={index}>{word} </span>
                    ))}
                  </span>

                  <span className="chevron">›</span>
                </button>
              ))}
            </div>
          </section>

          {/* ================= RECOMMENDED ================= */}

          <section className="hero-panel card">
            <img src={timeData.background} alt="" className="hero-bg-img" />

            <div className="hero-overlay"></div>

            <div className="hero-content">
              <h1>{t(`home.${timeData.greetingKey || "goodMorning"}`)}</h1>

              <p className="hero-subtitle">{t("home.subtitle")}</p>

              <div className="home-voice-help">
                <VoiceButton
                  text={[
                    t(`home.${timeData.greetingKey || "goodMorning"}`),
                    t("home.voiceIntro"),
                    t("home.recommended"),
                    activeRecommendedGame.name,
                    activeRecommendedGame.description,
                  ].join(" ")}
                  label={t("common.voiceHelp")}
                />
              </div>

              <p className="eyebrow">{t("home.recommended")}</p>

              <div className="recommendation-card">
                <span
                  className={`recommendation-icon ${
                    activeRecommendedGame.id === "memory"
                      ? "lavender-icon"
                      : activeRecommendedGame.id === "routine"
                        ? "mint-icon"
                        : activeRecommendedGame.id === "attention"
                          ? "yellow-icon"
                          : activeRecommendedGame.id === "recognition"
                            ? "pink-icon"
                            : "blue-icon"
                  }`}
                >
                  {activeRecommendedGame.icon}
                </span>

                <div>
                  <h2>{activeRecommendedGame.name}</h2>

                  <p>{activeRecommendedGame.description}</p>

                  <span className="weak-game-label">{t("home.recommendedForYou")}</span>
                </div>
              </div>

              <button className="primary-btn play-btn" onClick={handlePlayNow}>
                <span>▶</span>
                Play Now
              </button>
            </div>
          </section>

          {/* ================= SIDE ================= */}

          <aside className="side-column">
            {/* REMINDERS */}

            <section className="reminders-card card">
              <div className="section-heading">
                <h2>Reminders</h2>

                <button
                  className="view-all"
                  onClick={() => setShowReminders(true)}
                >
                  View All <span>›</span>
                </button>
              </div>

              <div className="reminder-list">
                {reminders.slice(0, 4).map((reminder) => (
                  <label
                    className={`reminder-row ${reminder.done ? "done" : ""}`}
                    key={reminder.id}
                  >
                    <input
                      type="checkbox"
                      checked={reminder.done}
                      onChange={() => toggleReminder(reminder.id)}
                    />

                    <span className="custom-checkbox"></span>

                    <span className="reminder-text">
                      <strong>{reminder.title}</strong>

                      <small>{reminder.time}</small>
                    </span>
                  </label>
                ))}
              </div>

              <button
                className="add-reminder-btn"
                onClick={() => setShowAddReminder(true)}
              >
                + Add Reminder
              </button>
            </section>

            {/* DAILY THOUGHT */}

            <section className="motivation-card card">
              <span className="thought-label">DAILY THOUGHT</span>

              <p>“{dailyThought}”</p>

              <span className="quote-line"></span>

              <strong>Keep Going!</strong>
            </section>
          </aside>
        </main>
      </div>

      {/* ================= PROFILE MODAL ================= */}

      {showProfile && (
        <div className="modal-backdrop" onClick={() => setShowProfile(false)}>
          <div
            className="profile-modal card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowProfile(false)}
            >
              ×
            </button>

            <div className="profile-avatar">♙</div>

            <h2>{patientName}</h2>

            <p className="profile-role">Patient</p>

            <div className="profile-info">
              <div>
                <span>Name</span>
                <strong>{patientName}</strong>
              </div>

              <div>
                <span>Age</span>
                <strong>
                  {localStorage.getItem("manasAge") ||
                    sessionStorage.getItem("manasAge") ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>Mobile</span>
                <strong>
                  {localStorage.getItem("manasMobile") ||
                    sessionStorage.getItem("manasMobile") ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>{t("common.language")}</span>
                <strong>{LANGUAGES.find((item) => item.code === language)?.nativeName || "English"}</strong>
              </div>

              <div>
                <span>State</span>
                <strong>{selectedStateName}</strong>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              {t("home.logout")}
            </button>
          </div>
        </div>
      )}

      {/* ================= ALL REMINDERS ================= */}

      {showReminders && (
        <div className="modal-backdrop" onClick={() => setShowReminders(false)}>
          <div
            className="reminder-modal card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowReminders(false)}
            >
              ×
            </button>

            <span className="modal-eyebrow">TODAY</span>

            <h2>All Reminders</h2>

            <div className="all-reminders">
              {reminders.map((reminder) => (
                <div
                  className={`full-reminder ${reminder.done ? "done" : ""}`}
                  key={reminder.id}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={reminder.done}
                      onChange={() => toggleReminder(reminder.id)}
                    />

                    <span className="custom-checkbox"></span>

                    <span>
                      <strong>{reminder.title}</strong>

                      <small>{reminder.time}</small>
                    </span>
                  </label>

                  <button
                    className="delete-reminder"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              className="modal-add-btn"
              onClick={() => {
                setShowReminders(false);
                setShowAddReminder(true);
              }}
            >
              + Add Reminder
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD REMINDER ================= */}

      {showAddReminder && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddReminder(false)}
        >
          <div
            className="add-reminder-modal card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowAddReminder(false)}
            >
              ×
            </button>

            <span className="modal-eyebrow">REMINDERS</span>

            <h2>Add Reminder</h2>

            <label className="form-field">
              <span>Reminder</span>

              <input
                type="text"
                placeholder="e.g. Take medicine"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Time</span>

              <input
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
              />
            </label>

            <button className="save-reminder-btn" onClick={addReminder}>
              Add Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHome;
