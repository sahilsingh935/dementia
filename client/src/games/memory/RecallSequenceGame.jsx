import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RecallSequenceGame.css";
import { saveRecallSequenceResult } from "../../services/recallSequenceDb";

const selectedState = "Assam";

const imageModules = import.meta.glob(
  "../../assets/cultural/memory/**/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const LEVEL_LENGTH = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
};

const DISPLAY_TIME = {
  1: 8,
  2: 8,
  3: 10,
  4: 10,
  5: 12,
};

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

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

export default function RecallSequenceGame() {
  const navigate = useNavigate();

  const [level, setLevel] = useState(1);

  const [sequence, setSequence] = useState([]);
  const [options, setOptions] = useState([]);
  const [userSequence, setUserSequence] = useState([]);

  const [showSequence, setShowSequence] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [result, setResult] = useState("");

  const [timeLeft, setTimeLeft] = useState(DISPLAY_TIME[1]);

  const [totalAttempts, setTotalAttempts] = useState(0);

  const [correctAttempts, setCorrectAttempts] = useState(0);

  const [mistakes, setMistakes] = useState(0);

  const [accuracy, setAccuracy] = useState(0);

  const [responseTime, setResponseTime] = useState(0);

  const [score, setScore] = useState(0);

  const gameStartTimeRef = useRef(null);

  const sequenceLength = LEVEL_LENGTH[level];

  const stateImages = getStateImages(selectedState);

  // ========================================
  // START LEVEL
  // ========================================

  const beginLevel = (levelNumber) => {
    const length = LEVEL_LENGTH[levelNumber];

    if (stateImages.length < length) {
      setResult("Not enough images available.");
      return;
    }

    const newSequence = shuffle(stateImages).slice(0, length);

    setSequence(newSequence);
    setOptions([]);
    setUserSequence([]);

    setResult("");
    setGameStarted(true);
    setShowSequence(true);

    setTimeLeft(DISPLAY_TIME[levelNumber]);

    gameStartTimeRef.current = Date.now();
  };

  // ========================================
  // AUTH CHECK + AUTO START
  // ========================================

  useEffect(() => {
    const token =
      localStorage.getItem("manasToken") ||
      sessionStorage.getItem("manasToken");

    const role =
      localStorage.getItem("manasRole") || sessionStorage.getItem("manasRole");

    const userId =
      localStorage.getItem("manasUserId") ||
      sessionStorage.getItem("manasUserId");

    if (!token || role !== "patient" || !userId) {
      navigate("/");
      return;
    }

    beginLevel(1);
  }, [navigate]);

  // ========================================
  // TIMER
  // ========================================

  useEffect(() => {
    if (!showSequence) return;

    if (timeLeft === 0) {
      setShowSequence(false);
      setOptions(shuffle(sequence));
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showSequence, timeLeft, sequence]);

  // ========================================
  // IMAGE SELECT
  // ========================================

  const handleImageClick = (image) => {
    if (userSequence.length >= sequenceLength) {
      return;
    }

    if (userSequence.includes(image)) {
      return;
    }

    const newUserSequence = [...userSequence, image];

    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequenceLength) {
      checkAnswer(newUserSequence);
    }
  };

  // ========================================
  // CHECK ANSWER
  // ========================================

  const checkAnswer = async (answer) => {
    const newTotalAttempts = totalAttempts + 1;

    const isCorrect = answer.every((image, index) => image === sequence[index]);

    const timeTaken = Math.round(
      (Date.now() - gameStartTimeRef.current) / 1000,
    );

    setResponseTime(timeTaken);

    // ======================================
    // CORRECT
    // ======================================

    if (isCorrect) {
      const newCorrectAttempts = correctAttempts + 1;

      setTotalAttempts(newTotalAttempts);

      setCorrectAttempts(newCorrectAttempts);

      const newAccuracy = (newCorrectAttempts / newTotalAttempts) * 100;

      setAccuracy(Number(newAccuracy.toFixed(2)));

      const newScore = Math.max(0, Math.round(newAccuracy));

      setScore(newScore);
      setResult("correct");

      // Save result safely
      try {
        await saveRecallSequenceResult({
          level,
          sequenceLength,
          totalAttempts: newTotalAttempts,
          correctAttempts: newCorrectAttempts,
          mistakes,
          accuracy: Number(newAccuracy.toFixed(2)),
          responseTime: timeTaken,
          score: newScore,
          difficultyChange: "SAME",
        });
      } catch (error) {
        console.error("Failed to save Recall Sequence result:", error);
      }
    }

    // ======================================
    // WRONG
    // ======================================
    else {
      const newMistakes = mistakes + 1;

      setTotalAttempts(newTotalAttempts);

      setMistakes(newMistakes);

      const newAccuracy = (correctAttempts / newTotalAttempts) * 100;

      setAccuracy(Number(newAccuracy.toFixed(2)));

      const newScore = Math.max(0, Math.round(newAccuracy));

      setScore(newScore);
      setResult("wrong");

      // Save result safely
      try {
        await saveRecallSequenceResult({
          level,
          sequenceLength,
          totalAttempts: newTotalAttempts,
          correctAttempts,
          mistakes: newMistakes,
          accuracy: Number(newAccuracy.toFixed(2)),
          responseTime: timeTaken,
          score: newScore,
          difficultyChange: "SAME",
        });
      } catch (error) {
        console.error("Failed to save Recall Sequence result:", error);
      }
    }
  };

  // ========================================
  // AUTO NEXT LEVEL
  // ========================================

  useEffect(() => {
    if (result !== "correct") {
      return;
    }

    if (level >= 5) {
      return;
    }

    const timer = setTimeout(() => {
      const nextLevel = level + 1;

      setLevel(nextLevel);

      setTotalAttempts(0);
      setCorrectAttempts(0);
      setMistakes(0);
      setAccuracy(0);
      setResponseTime(0);
      setScore(0);

      beginLevel(nextLevel);
    }, 1200);

    return () => clearTimeout(timer);
  }, [result, level]);

  // ========================================
  // TRY AGAIN
  // ========================================

  const restartGame = () => {
    beginLevel(level);
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="recall-container">
      {/* ==================================
          MAIN CARD
      ================================== */}

      <div className="recall-game-box">
        {/* BACK BUTTON */}

        <div className="recall-topbar">
          <button
            type="button"
            className="recall-back-button"
            onClick={() => navigate("/patient")}
          >
            ← Back
          </button>
        </div>

        {/* ==================================
            TITLE
        ================================== */}

        <div className="recall-title-row">
          <span className="title-leaf">❧</span>

          <h1>Recall the Sequence</h1>

          <span className="title-leaf title-leaf-right">❧</span>
        </div>

        {/* ==================================
            REMEMBER SEQUENCE
        ================================== */}

        {gameStarted && showSequence && (
          <div className="game-section">
            <div className="section-heading">
              Remember the images in the exact order.
            </div>

            <div className="image-row">
              {sequence.map((image, index) => (
                <div className="sequence-card" key={`${image}-${index}`}>
                  <img src={image} alt="Memory item" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================
            SELECT SEQUENCE
        ================================== */}

        {gameStarted && !showSequence && !result && (
          <div className="game-section">
            <div className="section-heading">
              Remember the images in the exact order.
            </div>

            <div className="selected-row">
              {userSequence.map((image, index) => (
                <div className="selected-card" key={`${image}-${index}`}>
                  <img src={image} alt="Selected memory item" />
                </div>
              ))}
            </div>

            <p className="selection-count">
              Selected: {userSequence.length}
              {" / "}
              {sequenceLength}
            </p>

            <div className="options-grid">
              {options.map((image, index) => {
                const alreadySelected = userSequence.includes(image);

                return (
                  <button
                    type="button"
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

        {/* ==================================
            CORRECT
        ================================== */}

        {result === "correct" && (
          <div className="result-section">
            <h2>🎉 Correct!</h2>

            <p>Accuracy: {accuracy}%</p>

            <p>Score: {score}</p>

            {level < 5 && (
              <p className="next-message">Next level is starting...</p>
            )}

            {level >= 5 && <h3>🏆 All Levels Completed!</h3>}
          </div>
        )}

        {/* ==================================
            WRONG
        ================================== */}

        {result === "wrong" && (
          <div className="result-section">
            <h2>❌ Wrong Sequence</h2>

            <p>Don't worry. Try again!</p>

            <p>Accuracy: {accuracy}%</p>

            <p>Mistakes: {mistakes}</p>

            <button
              type="button"
              className="start-button"
              onClick={restartGame}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
