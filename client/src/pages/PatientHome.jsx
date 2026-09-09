import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientHome.css";

const games = [
  {
    id: "memory",
    name: "Memory Puzzles",
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

const thoughts = [
  "Small steps. Brighter days.",
  "A healthier mind leads to a happier you.",
  "Take your time. You are doing great.",
  "Every day is a new opportunity to learn.",
  "Keep practicing. You are making progress.",
  "One step at a time is still progress.",
  "Believe in yourself and keep going.",
];

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

function getTimeData() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good Morning!",
      background: "/assets/login-bg/morning-bg.jpg",
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good Afternoon!",
      background: "/assets/login-bg/afternoon-bg.jpg",
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good Evening!",
      background: "/assets/login-bg/evening-bg.jpg",
    };
  }

  return {
    greeting: "Good Night!",
    background: "/assets/login-bg/night-bg.jpg",
  };
}

function getDailyThought() {
  const today = new Date();

  const dateNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000,
  );

  return thoughts[Math.abs(dateNumber) % thoughts.length];
}

function PatientHome() {
  const navigate = useNavigate();

  const [timeData, setTimeData] = useState(getTimeData());

  const [selectedGame, setSelectedGame] = useState(games[0]);

  const [recommendedGame, setRecommendedGame] = useState(games[0]);

  const [reminders, setReminders] = useState([]);

  const [patientName, setPatientName] = useState("Guest User");

  const [language, setLanguage] = useState("English");

  const [showLanguage, setShowLanguage] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [showReminders, setShowReminders] = useState(false);

  const [showAddReminder, setShowAddReminder] = useState(false);

  const [newReminderTitle, setNewReminderTitle] = useState("");

  const [newReminderTime, setNewReminderTime] = useState("");

  const [dailyThought, setDailyThought] = useState(getDailyThought());

  /* ================= PATIENT DATA ================= */

  useEffect(() => {
    const name =
      localStorage.getItem("manasUser") || localStorage.getItem("patientName");

    if (name) {
      setPatientName(name);
    }

    const savedLanguage = localStorage.getItem("manasLanguage");

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const savedReminders = localStorage.getItem("manasReminders");

    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch {
        setReminders(defaultReminders);
      }
    } else {
      setReminders(defaultReminders);
    }
  }, []);

  /* ================= SAVE REMINDERS ================= */

  useEffect(() => {
    localStorage.setItem("manasReminders", JSON.stringify(reminders));
  }, [reminders]);

  /* ================= TIME UPDATE ================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeData(getTimeData());
      setDailyThought(getDailyThought());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  /* ================= ML RECOMMENDATION ================= */

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

  /* ================= LOCAL FALLBACK ================= */

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

  /* ================= GAME ================= */

  function handleGameClick(game) {
    setSelectedGame(game);
    navigate(game.path);
  }

  function handlePlayNow() {
    navigate(recommendedGame.path);
  }

  /* ================= REMINDERS ================= */

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

  /* ================= LANGUAGE ================= */

  function changeLanguage(value) {
    setLanguage(value);

    localStorage.setItem("manasLanguage", value);

    setShowLanguage(false);
  }

  /* ================= LOGOUT ================= */

  function handleLogout() {
    localStorage.removeItem("manasRole");
    localStorage.removeItem("manasUser");
    localStorage.removeItem("manasUserId");
    localStorage.removeItem("manasAge");
    localStorage.removeItem("manasMobile");

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
            <button className="header-nav" onClick={() => navigate("/patient")}>
              <span>⌂</span>
              HOME
            </button>

            {/* LANGUAGE */}

            <div className="menu-wrap">
              <button
                className="header-nav"
                onClick={() => setShowLanguage(!showLanguage)}
              >
                <span>◎</span>
                LANGUAGE
              </button>

              {showLanguage && (
                <div className="floating-menu language-menu">
                  {["English", "অসমীয়া", "বাংলা", "মণিপুরি", "नेपाली"].map(
                    (item) => (
                      <button
                        key={item}
                        className={language === item ? "active-language" : ""}
                        onClick={() => changeLanguage(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}
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
              <h2>CHOOSE GAME</h2>

              <span className="game-count">5 games</span>
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
              <p className="eyebrow">RECOMMENDED GAME</p>

              <h1>{timeData.greeting}</h1>

              <p className="hero-subtitle">Ready for a healthy mind today?</p>

              <div className="recommendation-card">
                <span
                  className={`recommendation-icon ${
                    recommendedGame.id === "memory"
                      ? "lavender-icon"
                      : recommendedGame.id === "routine"
                        ? "mint-icon"
                        : recommendedGame.id === "attention"
                          ? "yellow-icon"
                          : recommendedGame.id === "recognition"
                            ? "pink-icon"
                            : "blue-icon"
                  }`}
                >
                  {recommendedGame.icon}
                </span>

                <div>
                  <h2>{recommendedGame.name}</h2>

                  <p>{recommendedGame.description}</p>

                  <span className="weak-game-label">Recommended for you</span>
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
                <strong>{localStorage.getItem("manasAge") || "—"}</strong>
              </div>

              <div>
                <span>Mobile</span>
                <strong>{localStorage.getItem("manasMobile") || "—"}</strong>
              </div>

              <div>
                <span>Language</span>
                <strong>{language}</strong>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Log Out
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
