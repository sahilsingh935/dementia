import { useEffect, useRef, useState } from "react";
import { dbPromise } from "../../services/db";
import "./MemoryGame.css";

// =========================
// AUTH
// =========================

function getLoggedInPatientId() {
  return (
    localStorage.getItem("manasUserId") ||
    sessionStorage.getItem("manasUserId") ||
    null
  );
}

// =========================
// LOAD CULTURAL IMAGES
// =========================

const imageModules = import.meta.glob(
  "../../assets/cultural/memory/**/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// =========================
// GET IMAGES FOR STATE
// =========================

function getStateImages(state) {
  const images = [];
  const statePath = `../../assets/cultural/memory/${state}/`;

  for (let i = 1; i <= 11; i++) {
    const imagePath = `${statePath}${i}.png`;

    if (imageModules[imagePath]) {
      images.push(imageModules[imagePath]);
    }
  }

  return images;
}

// =========================
// SHUFFLE
// =========================

function shuffleCards(cards) {
  return [...cards].sort(() => Math.random() - 0.5);
}

// =========================
// CREATE GAME CARDS
// =========================

function createGameCards(stateImages, level) {
  // Level 1 = 2 pairs
  // Level 2 = 3 pairs
  // Level 3 = 4 pairs
  // Level 4 = 5 pairs
  // Level 5 = 6 pairs

  const numberOfPairs = level + 1;

  const selectedImages = shuffleCards(stateImages).slice(0, numberOfPairs);

  return shuffleCards([...selectedImages, ...selectedImages]);
}

// =========================
// MAIN COMPONENT
// =========================

function MemoryGame() {
  const selectedState = "Assam";

  const stateImages = getStateImages(selectedState);

  const [level, setLevel] = useState(1);

  const [gameCards, setGameCards] = useState(() =>
    createGameCards(stateImages, 1),
  );

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);

  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // =========================================
  // LATER PERFORMANCE TRACKING
  // =========================================

  const [laterAttempts, setLaterAttempts] = useState(0);
  const [laterMistakes, setLaterMistakes] = useState(0);

  /*
    IMPORTANT:

    Attempts are tracked PER PAIR.

    Example Level 3:

    Pair A:
    attempt 1 → learning
    attempt 2 → learning
    attempt 3 → learning
    attempt 4 → later

    Pair B:
    attempt 1 → learning
    attempt 2 → learning
    attempt 3 → learning
    attempt 4 → later
  */

  const pairAttemptsRef = useRef(new Map());

  const laterAttemptsRef = useRef(0);
  const laterMistakesRef = useRef(0);

  const [gameCompleted, setGameCompleted] = useState(false);

  // =========================================
  // ML STATES
  // =========================================

  // Previous level score
  const [previousScore, setPreviousScore] = useState(80);

  // ML prediction
  const [difficultyChange, setDifficultyChange] = useState(null);

  // ML prediction running
  const [isPredicting, setIsPredicting] = useState(false);

  // Prevent duplicate IndexedDB save
  const resultSavedRef = useRef(false);

  // =========================================
  // ATTEMPT RULE
  // =========================================

  const getAttemptsPerPair = () => {
    if (level === 1) return 1;
    if (level === 2) return 2;

    return 3;
  };

  // =========================================
  // GET CURRENT ATTEMPTS OF A PAIR
  // =========================================

  const getPairAttempts = (pairKey) => {
    return pairAttemptsRef.current.get(pairKey) || 0;
  };

  // =========================================
  // INCREMENT PAIR ATTEMPT
  // =========================================

  const incrementPairAttempt = (pairKey) => {
    const current = getPairAttempts(pairKey);

    pairAttemptsRef.current.set(pairKey, current + 1);

    return current;
  };

  // =========================================
  // CALCULATE PERFORMANCE
  // =========================================

  const calculatePerformance = () => {
    const matchedPairs = matched.length / 2;
    const totalPairs = gameCards.length / 2;

    const totalAttempts = moves;

    // Accuracy = correctly matched pairs / total pairs
    const accuracy =
      totalPairs > 0 ? Math.min(100, (matchedPairs / totalPairs) * 100) : 0;

    const mistakes = Math.max(0, totalAttempts - matchedPairs);

    const finalLaterAttempts = laterAttemptsRef.current;

    const finalLaterMistakes = laterMistakesRef.current;

    // Performance score
    const timeScore = Math.max(0, 100 - seconds * 3);

    const mistakeScore = Math.max(0, 100 - finalLaterMistakes * 15);

    const rawScore = accuracy * 0.6 + timeScore * 0.2 + mistakeScore * 0.2;

    const performance = {
      matchedPairs,
      totalPairs,
      totalAttempts,

      accuracy: Number(accuracy.toFixed(2)),

      mistakes,

      laterAttempts: finalLaterAttempts,

      laterMistakes: finalLaterMistakes,

      score: Number(Math.min(100, Math.max(0, rawScore)).toFixed(2)),
    };

    console.log("Memory Performance Generated:", performance);

    return performance;
  };

  // =========================================
  // ML PREDICTION
  // =========================================

  const getDifficultyPrediction = async ({
    accuracy,
    totalAttempts,
    laterAttempts,
    laterMistakes,
  }) => {
    try {
      setIsPredicting(true);

      const response = await fetch(
        "http://localhost:5000/api/difficulty/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            // V6 FEATURE 1
            current_level: level,

            // V6 FEATURE 2
            accuracy: accuracy,

            // V6 FEATURE 3
            // Total game time in seconds
            response_time: seconds,

            // V6 FEATURE 4
            total_attempts: totalAttempts,

            // V6 FEATURE 5
            later_attempts: laterAttempts,

            // V6 FEATURE 6
            later_mistakes: laterMistakes,

            // V6 FEATURE 7
            previous_score: previousScore,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("ML API failed");
      }

      const data = await response.json();

      console.log("ML Difficulty Prediction:", data.difficulty_change);

      return data.difficulty_change;
    } catch (error) {
      console.error("ML prediction failed:", error);

      // =========================================
      // OFFLINE FALLBACK
      // =========================================

      /*
        Early learning phase is ignored.

        Only later performance is used
        for fallback decision.
      */

      const laterAccuracy =
        laterAttempts > 0
          ? ((laterAttempts - laterMistakes) / laterAttempts) * 100
          : accuracy;

      // HARDER
      if (laterAccuracy >= 80 && laterMistakes <= 1 && previousScore >= 72) {
        return "HARDER";
      }

      // EASIER
      if (laterAccuracy < 55 || laterMistakes >= 2) {
        return "EASIER";
      }

      return "SAME";
    } finally {
      setIsPredicting(false);
    }
  };

  // =========================================
  // SAVE RESULT TO INDEXEDDB
  // =========================================

  const saveGameResult = async ({
    finalMoves,
    finalSeconds,
    finalAccuracy,
    finalMistakes,
    finalScore,
    finalTotalAttempts,
    finalLaterAttempts,
    finalLaterMistakes,
    prediction,
  }) => {
    if (resultSavedRef.current) return;

    const patientKey = getLoggedInPatientId();

    // Game result sirf logged-in patient ke liye save hoga
    if (!patientKey) {
      console.error("No logged-in patient found. Game result not saved.");
      return;
    }

    resultSavedRef.current = true;

    try {
      const db = await dbPromise;

      await db.add("gameResults", {
        // =========================
        // PATIENT IDENTIFICATION
        // =========================

        patientKey,

        // =========================
        // GAME INFORMATION
        // =========================

        game: "memory",

        state: selectedState,

        level,

        moves: finalMoves,

        seconds: finalSeconds,

        accuracy: finalAccuracy,

        mistakes: finalMistakes,

        score: finalScore,

        // =========================
        // ADAPTIVE DIFFICULTY DATA
        // =========================

        totalAttempts: finalTotalAttempts,

        laterAttempts: finalLaterAttempts,

        laterMistakes: finalLaterMistakes,

        difficultyChange: prediction,

        // =========================
        // SYNC INFORMATION
        // =========================

        completed: true,

        synced: false,

        createdAt: new Date().toISOString(),
      });

      console.log("Memory result saved locally:", {
        patientKey,
        level,
        score: finalScore,
        difficultyChange: prediction,
      });
    } catch (error) {
      resultSavedRef.current = false;

      console.error("Failed to save memory game result:", error);
    }
  };

  // =========================================
  // TIMER
  // =========================================

  useEffect(() => {
    if (gameCompleted) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameCompleted]);

  // =========================================
  // GAME COMPLETION
  // =========================================

  useEffect(() => {
    if (
      gameCards.length > 0 &&
      matched.length === gameCards.length &&
      !gameCompleted
    ) {
      setGameCompleted(true);

      const performance = calculatePerformance();

      console.log("Game Performance:", performance);

      // =========================================
      // ASK ML MODEL
      // =========================================

      const handlePrediction = async () => {
        const prediction = await getDifficultyPrediction({
          accuracy: performance.accuracy,

          totalAttempts: performance.totalAttempts,

          laterAttempts: performance.laterAttempts,

          laterMistakes: performance.laterMistakes,
        });

        console.log("ML Decision:", prediction);

        setDifficultyChange(prediction);

        // =========================================
        // SAVE COMPLETE RESULT
        // =========================================

        await saveGameResult({
          finalMoves: moves,

          finalSeconds: seconds,

          finalAccuracy: performance.accuracy,

          finalMistakes: performance.mistakes,

          finalScore: performance.score,

          finalTotalAttempts: performance.totalAttempts,

          finalLaterAttempts: performance.laterAttempts,

          finalLaterMistakes: performance.laterMistakes,

          prediction,
        });

        // =========================================
        // CURRENT SCORE → PREVIOUS SCORE
        // =========================================

        setPreviousScore(performance.score);
      };

      handlePrediction();
    }
  }, [matched, gameCards, gameCompleted, moves, seconds]);

  // =========================================
  // CARD CLICK
  // =========================================

  const handleCardClick = (index) => {
    if (flipped.length === 2) return;

    if (flipped.includes(index)) return;

    if (matched.includes(index)) return;

    if (gameCompleted) return;

    const newFlipped = [...flipped, index];

    setFlipped(newFlipped);

    // =========================================
    // TWO CARDS SELECTED
    // =========================================

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);

      const firstIndex = newFlipped[0];

      const secondIndex = newFlipped[1];

      const firstCard = gameCards[firstIndex];

      const secondCard = gameCards[secondIndex];

      const attemptLimit = getAttemptsPerPair();

      // =========================================
      // CURRENT PAIR ATTEMPTS
      // =========================================

      const firstPairAttempts = getPairAttempts(firstCard);

      const secondPairAttempts = getPairAttempts(secondCard);

      /*
        An attempt is considered a LATER attempt
        only when both selected pair identities
        have already completed their learning phase.

        This prevents early exploration from being
        counted as actual poor performance.
      */

      const isLaterAttempt =
        firstPairAttempts >= attemptLimit && secondPairAttempts >= attemptLimit;

      // =========================================
      // MATCH
      // =========================================

      if (firstCard === secondCard) {
        /*
          This is one attempt for this pair.

          Check BEFORE incrementing whether this
          attempt is already beyond the learning phase.
        */

        if (isLaterAttempt) {
          laterAttemptsRef.current += 1;

          setLaterAttempts(laterAttemptsRef.current);
        }

        // Increment pair attempt once
        incrementPairAttempt(firstCard);

        setMatched((prev) => [...prev, firstIndex, secondIndex]);

        setTimeout(() => {
          setFlipped([]);
        }, 300);
      }

      // =========================================
      // NOT MATCH
      // =========================================
      else {
        /*
          Count this attempt for BOTH selected
          pair identities.

          Example:

          A + B mismatch

          A attempts +1
          B attempts +1
        */

        if (isLaterAttempt) {
          laterAttemptsRef.current += 1;

          laterMistakesRef.current += 1;

          setLaterAttempts(laterAttemptsRef.current);

          setLaterMistakes(laterMistakesRef.current);
        }

        // Increment both pair counters
        incrementPairAttempt(firstCard);
        incrementPairAttempt(secondCard);

        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  // =========================================
  // NEXT LEVEL BASED ON ML
  // =========================================

  const nextLevel = () => {
    let newLevel = level;

    // =========================================
    // HARDER
    // =========================================

    if (difficultyChange === "HARDER") {
      newLevel = Math.min(5, level + 1);
    }

    // =========================================
    // EASIER
    // =========================================
    else if (difficultyChange === "EASIER") {
      newLevel = Math.max(1, level - 1);
    }

    // =========================================
    // SAME
    // =========================================
    else {
      newLevel = level;
    }

    console.log(`ML Decision: ${difficultyChange}`);

    console.log(`Level ${level} → Level ${newLevel}`);

    setLevel(newLevel);

    setGameCards(createGameCards(stateImages, newLevel));

    setFlipped([]);

    setMatched([]);

    setMoves(0);

    setSeconds(0);

    // =========================================
    // RESET PER-PAIR TRACKING
    // =========================================

    pairAttemptsRef.current = new Map();

    laterAttemptsRef.current = 0;

    laterMistakesRef.current = 0;

    setLaterAttempts(0);

    setLaterMistakes(0);

    setGameCompleted(false);

    setDifficultyChange(null);

    resultSavedRef.current = false;
  };

  // =========================================
  // RESTART GAME
  // =========================================

  const restartGame = () => {
    setLevel(1);

    setGameCards(createGameCards(stateImages, 1));

    setFlipped([]);

    setMatched([]);

    setMoves(0);

    setSeconds(0);

    // Reset per-pair tracking
    pairAttemptsRef.current = new Map();

    laterAttemptsRef.current = 0;

    laterMistakesRef.current = 0;

    setLaterAttempts(0);

    setLaterMistakes(0);

    setGameCompleted(false);

    setDifficultyChange(null);

    // Level 1 initial previous score
    setPreviousScore(80);

    resultSavedRef.current = false;
  };

  // =========================================
  // BUTTON TEXT
  // =========================================

  const getNextButtonText = () => {
    if (difficultyChange === "HARDER") {
      return "Increase Difficulty →";
    }

    if (difficultyChange === "EASIER") {
      return "Try Easier Level →";
    }

    return "Continue Same Level →";
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="memory-page">
      <div className="memory-container">
        {/* ================= HEADER ================= */}

        <div className="game-header">
          <div className="game-title-section">
            <p className="game-label">MEMORY ACTIVITY</p>

            <h1>Memory Match 🧠</h1>

            <p className="game-subtitle">Find the matching pictures</p>
          </div>

          <div className="level-badge">Level {level}</div>
        </div>

        {/* ================= CARDS ================= */}

        <div className="memory-grid">
          {gameCards.map((image, index) => {
            const isFlipped = flipped.includes(index);

            const isMatched = matched.includes(index);

            return (
              <button
                key={index}
                className={`memory-card ${isMatched ? "matched" : ""}`}
                onClick={() => handleCardClick(index)}
                aria-label="Memory card"
              >
                {isFlipped || isMatched ? (
                  <img src={image} alt="Memory card" />
                ) : (
                  <div className="card-back">
                    <span>?</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ================= COMPLETION ================= */}

        {gameCompleted && (
          <div className="completion-box">
            {isPredicting ? (
              <>
                <div className="success-icon">🧠</div>

                <h2>Analysing Performance...</h2>

                <p>Adjusting difficulty for the next level</p>
              </>
            ) : level < 5 ? (
              <>
                <div className="success-icon">🎉</div>

                <h2>Well Done!</h2>

                <p>Your performance has been analysed.</p>

                {difficultyChange && (
                  <p>
                    ML Recommendation: <strong>{difficultyChange}</strong>
                  </p>
                )}

                <button
                  className="next-button"
                  onClick={nextLevel}
                  disabled={isPredicting}
                >
                  {getNextButtonText()}
                </button>
              </>
            ) : (
              <>
                <div className="success-icon">🏆</div>

                <h2>Excellent!</h2>

                <p>You completed the game!</p>

                <button className="next-button" onClick={restartGame}>
                  Play Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemoryGame;
