import { useEffect, useRef, useState } from "react";
import "./RecallSequenceGame.css";
import { saveRecallSequenceResult } from "../../services/recallSequenceDb";

// ========================================
// STATE
// ========================================

const selectedState = "Assam";

// ========================================
// IMAGES
// ========================================

const imageModules = import.meta.glob(
  "../../assets/cultural/memory/**/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// ========================================
// LEVEL CONFIGURATION
// ========================================

const LEVEL_LENGTH = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
};

// ========================================
// DISPLAY TIME
// ========================================

const DISPLAY_TIME = {
  1: 8,
  2: 8,
  3: 10,
  4: 10,
  5: 12,
};

// ========================================
// SHUFFLE
// ========================================

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// ========================================
// GET STATE IMAGES
// ========================================

function getStateImages(state) {
  const images = [];

  for (let i = 1; i <= 11; i++) {
    const key = Object.keys(imageModules).find((path) => {
      return (
        path.includes(`/${state}/`) &&
        new RegExp(`/${i}\\.(png|jpg|jpeg|webp)$`, "i").test(path)
      );
    });

    if (key) {
      images.push(imageModules[key]);
    }
  }

  return images;
}

// ========================================
// GAME
// ========================================

export default function RecallSequenceGame() {
  // ========================================
  // GAME STATE
  // ========================================

  const [level, setLevel] = useState(1);

  const [sequence, setSequence] = useState([]);

  const [options, setOptions] = useState([]);

  const [userSequence, setUserSequence] = useState([]);

  const [showSequence, setShowSequence] = useState(false);

  const [gameStarted, setGameStarted] = useState(false);

  const [result, setResult] = useState("");

  // ========================================
  // INTERNAL TIMER
  // ========================================

  // Patient ko timer screen par nahi dikhega
  const [timeLeft, setTimeLeft] = useState(DISPLAY_TIME[1]);

  // ========================================
  // PERFORMANCE DATA
  // ========================================

  const [totalAttempts, setTotalAttempts] = useState(0);

  const [correctAttempts, setCorrectAttempts] = useState(0);

  const [mistakes, setMistakes] = useState(0);

  const [accuracy, setAccuracy] = useState(0);

  const [responseTime, setResponseTime] = useState(0);

  const [score, setScore] = useState(0);

  // ========================================
  // PREVIOUS SCORE
  // ========================================

  const [previousScore, setPreviousScore] = useState(0);

  // ========================================
  // ML PREDICTION
  // ========================================

  const [difficultyChange, setDifficultyChange] = useState("SAME");

  // ========================================
  // GAME START TIME
  // ========================================

  const gameStartTimeRef = useRef(null);

  // ========================================
  // AUTO START CONTROL
  // ========================================

  const autoStartRef = useRef(false);

  // ========================================
  // LEVEL DATA
  // ========================================

  const sequenceLength = LEVEL_LENGTH[level];

  const stateImages = getStateImages(selectedState);

  // ========================================
  // START GAME
  // ========================================

  const startGame = () => {
    if (stateImages.length < sequenceLength) {
      setResult("Not enough images available.");
      return;
    }

    // New random sequence
    const newSequence = shuffle(stateImages).slice(0, sequenceLength);

    setSequence(newSequence);

    setOptions([]);

    setUserSequence([]);

    setResult("");

    setGameStarted(true);

    setShowSequence(true);

    // Internal display timer
    setTimeLeft(DISPLAY_TIME[level]);

    // Start response-time measurement
    gameStartTimeRef.current = Date.now();
  };

  // ========================================
  // AUTO START GAME
  // ========================================

  useEffect(() => {
    if (!gameStarted && !result && !autoStartRef.current) {
      autoStartRef.current = true;

      startGame();
    }
  }, [level]);

  // ========================================
  // INTERNAL COUNTDOWN
  // ========================================

  useEffect(() => {
    if (!showSequence) {
      return;
    }

    if (timeLeft === 0) {
      setShowSequence(false);

      // Same images, shuffled
      setOptions(shuffle(sequence));

      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showSequence, timeLeft, sequence]);

  // ========================================
  // IMAGE CLICK
  // ========================================

  const handleImageClick = (image) => {
    if (userSequence.length >= sequenceLength) {
      return;
    }

    // Same image cannot be selected twice
    if (userSequence.includes(image)) {
      return;
    }

    const newUserSequence = [...userSequence, image];

    setUserSequence(newUserSequence);

    // Complete sequence
    if (newUserSequence.length === sequenceLength) {
      checkAnswer(newUserSequence);
    }
  };

  // ========================================
  // REMOVE SELECTED IMAGE
  // ========================================

  const removeSelectedImage = (imageToRemove) => {
    setUserSequence((prev) => prev.filter((image) => image !== imageToRemove));
  };

  // ========================================
  // ML API CALL
  // ========================================

  const getDifficultyPrediction = async ({
    sequenceLength,
    accuracy,
    responseTime,
    totalAttempts,
    mistakes,
    previousScore,
    currentLevel,
  }) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/recall-sequence/difficulty/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            sequence_length: sequenceLength,

            accuracy,

            response_time: responseTime,

            total_attempts: totalAttempts,

            mistakes,

            previous_score: previousScore,

            current_level: currentLevel,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("ML API request failed");
      }

      const data = await response.json();

      return data.difficulty_change || "SAME";
    } catch (error) {
      console.error("Recall Sequence ML error:", error);

      // Offline/API failure
      // Same difficulty fallback
      return "SAME";
    }
  };

  // ========================================
  // CHECK ANSWER
  // ========================================

  const checkAnswer = async (answer) => {
    // One attempt completed
    const newTotalAttempts = totalAttempts + 1;

    const isCorrect = answer.every((image, index) => image === sequence[index]);

    // ========================================
    // RESPONSE TIME
    // ========================================

    const timeTaken = Math.round(
      (Date.now() - gameStartTimeRef.current) / 1000,
    );

    setResponseTime(timeTaken);

    // ========================================
    // CORRECT
    // ========================================

    if (isCorrect) {
      const newCorrectAttempts = correctAttempts + 1;

      const newAccuracy = (newCorrectAttempts / newTotalAttempts) * 100;

      const roundedAccuracy = Number(newAccuracy.toFixed(2));

      const newScore = Math.max(0, Math.round(newAccuracy));

      setTotalAttempts(newTotalAttempts);

      setCorrectAttempts(newCorrectAttempts);

      setAccuracy(roundedAccuracy);

      setScore(newScore);

      setResult("correct");

      // ========================================
      // ASK ML
      // ========================================

      const prediction = await getDifficultyPrediction({
        sequenceLength,

        accuracy: roundedAccuracy,

        responseTime: timeTaken,

        totalAttempts: newTotalAttempts,

        mistakes,

        previousScore,

        currentLevel: level,
      });

      console.log("Recall Sequence ML:", prediction);

      setDifficultyChange(prediction);

      // ========================================
      // SAVE RESULT
      // ========================================

      await saveRecallSequenceResult({
        level,

        sequenceLength,

        totalAttempts: newTotalAttempts,

        correctAttempts: newCorrectAttempts,

        mistakes,

        accuracy: roundedAccuracy,

        responseTime: timeTaken,

        score: newScore,

        difficultyChange: prediction,

        previousScore,
      });

      // Current score becomes
      // previous score
      setPreviousScore(newScore);

      // ========================================
      // AUTOMATIC NEXT LEVEL
      // ========================================

      setTimeout(() => {
        nextLevel(prediction);
      }, 1200);
    } else {
      // ========================================
      // WRONG
      // ========================================

      const newMistakes = mistakes + 1;

      const newAccuracy = (correctAttempts / newTotalAttempts) * 100;

      const roundedAccuracy = Number(newAccuracy.toFixed(2));

      const newScore = Math.max(0, Math.round(newAccuracy));

      setTotalAttempts(newTotalAttempts);

      setMistakes(newMistakes);

      setAccuracy(roundedAccuracy);

      setScore(newScore);

      setResult("wrong");

      // ========================================
      // SAVE WRONG ATTEMPT
      // ========================================

      await saveRecallSequenceResult({
        level,

        sequenceLength,

        totalAttempts: newTotalAttempts,

        correctAttempts,

        mistakes: newMistakes,

        accuracy: roundedAccuracy,

        responseTime: timeTaken,

        score: newScore,

        difficultyChange: "SAME",

        previousScore,
      });
    }
  };

  // ========================================
  // NEXT LEVEL USING ML
  // ========================================

  const nextLevel = (prediction) => {
    let nextLevelValue = level;

    // ========================================
    // ML DECISION
    // ========================================

    if (prediction === "HARDER") {
      nextLevelValue = Math.min(5, level + 1);
    } else if (prediction === "EASIER") {
      nextLevelValue = Math.max(1, level - 1);
    } else {
      // SAME
      nextLevelValue = level;
    }

    console.log("Current Level:", level);

    console.log("ML Decision:", prediction);

    console.log("Next Level:", nextLevelValue);

    // ========================================
    // RESET GAME UI
    // ========================================

    setGameStarted(false);

    setSequence([]);

    setOptions([]);

    setUserSequence([]);

    setShowSequence(false);

    setResult("");

    setTimeLeft(DISPLAY_TIME[nextLevelValue]);

    setDifficultyChange(prediction);

    // ========================================
    // LEVEL CHANGE
    // ========================================

    if (nextLevelValue !== level) {
      setLevel(nextLevelValue);
    }

    // Allow automatic start again
    autoStartRef.current = false;
  };

  // ========================================
  // TRY AGAIN
  // ========================================

  const restartGame = () => {
    setGameStarted(false);

    setSequence([]);

    setOptions([]);

    setUserSequence([]);

    setShowSequence(false);

    setResult("");

    setTimeLeft(DISPLAY_TIME[level]);

    // Attempts and mistakes
    // preserve rahenge

    gameStartTimeRef.current = null;

    // Allow automatic start
    autoStartRef.current = false;

    // Automatically restart
    setTimeout(() => {
      startGame();
    }, 100);
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="recall-container">
      <h1>🧠 Recall the Sequence</h1>

      <h2>Level {level}</h2>

      <p className="instruction">Remember the images in the exact order.</p>

      {/* ==========================
          SHOW SEQUENCE
      ========================== */}

      {gameStarted && showSequence && (
        <div className="game-section">
          <h2>Remember this sequence</h2>

          <div className="image-row">
            {sequence.map((image, index) => (
              <div className="sequence-card" key={`${image}-${index}`}>
                <img src={image} alt="Memory item" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================
          SELECT SEQUENCE
      ========================== */}

      {gameStarted && !showSequence && !result && (
        <div className="game-section">
          <h2>Select the sequence</h2>

          {/* SELECTED ANSWER */}

          <div className="selected-row">
            {userSequence.map((image, index) => (
              <div className="selected-card" key={`${image}-${index}`}>
                {/* REMOVE BUTTON */}

                <button
                  type="button"
                  className="remove-card-button"
                  onClick={() => removeSelectedImage(image)}
                  aria-label="Remove selected image"
                >
                  ×
                </button>

                <img src={image} alt="Selected item" />
              </div>
            ))}
          </div>

          <p className="selection-count">
            Selected: {userSequence.length}
            {" / "}
            {sequenceLength}
          </p>

          {/* OPTIONS */}

          <div className="options-grid">
            {options.map((image, index) => {
              const alreadySelected = userSequence.includes(image);

              return (
                <button
                  key={`${image}-${index}`}
                  className="image-option"
                  onClick={() => handleImageClick(image)}
                  disabled={alreadySelected}
                >
                  <img src={image} alt="Memory option" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================
          CORRECT RESULT
      ========================== */}

      {result === "correct" && (
        <div className="result-section">
          <h2>🎉 Correct!</h2>

          <p>Accuracy: {accuracy}%</p>

          <p>Score: {score}</p>

          <p>Next level is starting...</p>
        </div>
      )}

      {/* ==========================
          WRONG RESULT
      ========================== */}

      {result === "wrong" && (
        <div className="result-section">
          <h2>❌ Wrong Sequence</h2>

          <p>Don't worry. Try again!</p>

          <p>Accuracy: {accuracy}%</p>

          <p>Mistakes: {mistakes}</p>

          <button className="start-button" onClick={restartGame}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
