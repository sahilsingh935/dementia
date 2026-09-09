import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "./RoutineGame.css";
import { saveRoutineResult } from "../../services/routineDb";

const imageModules = import.meta.glob("../../assets/states/assam/q*/img*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
});

function getImage(questionNumber, imageNumber) {
  const target = `/q${questionNumber}/img${imageNumber}.jpg`;

  const foundKey = Object.keys(imageModules).find((key) =>
    key.replace(/\\/g, "/").toLowerCase().endsWith(target.toLowerCase()),
  );

  if (foundKey) {
    return imageModules[foundKey];
  }

  return `/assets/states/assam/q${questionNumber}/img${imageNumber}.jpg`;
}

const answers = [0, 1, 2, 3, 0, 1, 2, 3, 1, 2];

const difficulties = [
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
  "hard",
  "medium",
  "medium",
  "hard",
  "hard",
];

const TOTAL_QUESTIONS = 10;

const questionBank = {};

for (let i = 0; i < TOTAL_QUESTIONS; i++) {
  const questionNumber = i + 1;

  questionBank[`q${questionNumber}`] = {
    id: questionNumber,

    images: [
      getImage(questionNumber, 1),
      getImage(questionNumber, 2),
      getImage(questionNumber, 3),
      getImage(questionNumber, 4),
    ],

    answer: answers[i],

    difficulty: difficulties[i],
  };
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function RoutineGame() {
  const navigate = useNavigate();

  // =================================
  // PREVIOUS ML DECISION
  // =================================

  const previousMLDecision =
    localStorage.getItem("routineLastDifficulty") || "SAME";

  // =================================
  // INITIAL DIFFICULTY
  // =================================

  function getInitialDifficulty() {
    if (previousMLDecision === "HARDER") {
      return "hard";
    }

    if (previousMLDecision === "EASIER") {
      return "easy";
    }

    return "easy";
  }

  const initialDifficulty = getInitialDifficulty();

  // =================================
  // GAME STATE
  // =================================

  const [currentQuestion, setCurrentQuestion] = useState(1);

  const [currentQuestionKey, setCurrentQuestionKey] = useState(() => {
    // First round
    if (previousMLDecision === "SAME") {
      return "q1";
    }

    // Find a question matching
    // previous ML difficulty
    const matchingQuestions = Object.keys(questionBank).filter(
      (key) => questionBank[key].difficulty === initialDifficulty,
    );

    if (matchingQuestions.length === 0) {
      return "q1";
    }

    const randomIndex = Math.floor(Math.random() * matchingQuestions.length);

    return matchingQuestions[randomIndex];
  });

  const [currentDifficulty, setCurrentDifficulty] = useState(initialDifficulty);

  const [score, setScore] = useState(0);

  const [usedQuestions, setUsedQuestions] = useState([]);

  const [selectedOption, setSelectedOption] = useState(null);

  const [answerLocked, setAnswerLocked] = useState(false);

  const [gameRunning, setGameRunning] = useState(true);

  const [finished, setFinished] = useState(false);

  const [showExitPopup, setShowExitPopup] = useState(false);

  const [shuffledOptions, setShuffledOptions] = useState([0, 1, 2, 3]);

  const [imageErrors, setImageErrors] = useState({});

  // =================================
  // RESULT TRACKING
  // =================================

  const totalAttemptsRef = useRef(0);

  const correctAttemptsRef = useRef(0);

  const mistakesRef = useRef(0);

  const gameStartTimeRef = useRef(Date.now());

  const previousScoreRef = useRef(
    Number(localStorage.getItem("routinePreviousScore") || 0),
  );

  const timeoutRef = useRef(null);

  const question = questionBank[currentQuestionKey];

  // =================================
  // MARK INITIAL QUESTION AS USED
  // =================================

  useEffect(() => {
    setUsedQuestions([currentQuestionKey]);
  }, []);

  // =================================
  // SHUFFLE OPTIONS
  // =================================

  useEffect(() => {
    setShuffledOptions(shuffle([0, 1, 2, 3]));

    setSelectedOption(null);
    setAnswerLocked(false);
  }, [currentQuestionKey]);

  // =================================
  // CLEANUP
  // =================================

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // =================================
  // GET NEXT QUESTION
  // =================================

  function getNextAdaptiveQuestion(difficulty, alreadyUsed) {
    const available = Object.keys(questionBank).filter(
      (key) => !alreadyUsed.includes(key),
    );

    if (available.length === 0) {
      return null;
    }

    const matching = available.filter(
      (key) => questionBank[key].difficulty === difficulty,
    );

    const pool = matching.length > 0 ? matching : available;

    const randomIndex = Math.floor(Math.random() * pool.length);

    return pool[randomIndex];
  }

  // =================================
  // GET ML PREDICTION
  // =================================

  async function getMLDifficulty({
    accuracy,
    responseTime,
    totalAttempts,
    mistakes,
    score,
    previousScore,
    difficulty,
  }) {
    try {
      const difficultyNumber =
        difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;

      const response = await fetch(
        "http://localhost:5000/api/routine/difficulty/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            current_difficulty: difficultyNumber,

            accuracy,

            response_time: responseTime,

            total_attempts: totalAttempts,

            mistakes,

            score,

            previous_score: previousScore,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`ML API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.difficulty_change) {
        return data.difficulty_change;
      }

      return "SAME";
    } catch (error) {
      console.error("Routine ML prediction failed:", error);

      return "SAME";
    }
  }

  // =================================
  // SAVE GAME RESULT
  // =================================

  async function saveGameResult(finalScore) {
    try {
      const totalAttempts = totalAttemptsRef.current;

      const correctAttempts = correctAttemptsRef.current;

      const mistakes = mistakesRef.current;

      const accuracy =
        totalAttempts > 0
          ? Number(((correctAttempts / totalAttempts) * 100).toFixed(2))
          : 0;

      const responseTime = Number(
        ((Date.now() - gameStartTimeRef.current) / 1000).toFixed(2),
      );

      const previousScore = previousScoreRef.current;

      // =================================
      // ML PREDICTION
      // =================================

      const difficultyChange = await getMLDifficulty({
        accuracy,
        responseTime,
        totalAttempts,
        mistakes,
        score: finalScore,
        previousScore,
        difficulty: currentDifficulty,
      });

      console.log("Routine ML Decision:", difficultyChange);

      // =================================
      // RESULT
      // =================================

      const result = {
        level: 1,

        totalQuestions: TOTAL_QUESTIONS,

        totalAttempts,

        correctAttempts,

        mistakes,

        score: finalScore,

        accuracy,

        responseTime,

        currentDifficulty,

        difficultyChange,

        previousScore,

        playedAt: new Date().toISOString(),
      };

      // =================================
      // SAVE TO INDEXEDDB
      // =================================

      await saveRoutineResult(result);

      // =================================
      // SAVE FOR NEXT ROUND
      // =================================

      localStorage.setItem("routinePreviousScore", String(finalScore));

      localStorage.setItem("routineLastDifficulty", difficultyChange);

      console.log("Routine result saved:", result);

      return difficultyChange;
    } catch (error) {
      console.error("Failed to save Routine result:", error);

      return "SAME";
    }
  }

  // =================================
  // ANSWER HANDLER
  // =================================

  function handleAnswer(selectedIndex) {
    if (!gameRunning || answerLocked || finished) {
      return;
    }

    totalAttemptsRef.current += 1;

    setAnswerLocked(true);

    setSelectedOption(selectedIndex);

    const isCorrect = selectedIndex === question.answer;

    let nextDifficulty = currentDifficulty;

    // =================================
    // CORRECT
    // =================================

    if (isCorrect) {
      correctAttemptsRef.current += 1;

      if (currentDifficulty === "easy") {
        nextDifficulty = "medium";
      } else if (currentDifficulty === "medium") {
        nextDifficulty = "hard";
      } else {
        nextDifficulty = "hard";
      }

      setScore((prevScore) => prevScore + 1);

      setCurrentDifficulty(nextDifficulty);
    }

    // =================================
    // WRONG
    // =================================
    else {
      mistakesRef.current += 1;

      if (currentDifficulty === "hard") {
        nextDifficulty = "medium";
      } else if (currentDifficulty === "medium") {
        nextDifficulty = "easy";
      } else {
        nextDifficulty = "easy";
      }

      setCurrentDifficulty(nextDifficulty);
    }

    // =================================
    // LAST QUESTION
    // =================================

    if (currentQuestion === TOTAL_QUESTIONS) {
      timeoutRef.current = setTimeout(async () => {
        setGameRunning(false);

        const finalScore = correctAttemptsRef.current;

        await saveGameResult(finalScore);

        setFinished(true);
      }, 700);

      return;
    }

    // =================================
    // NEXT QUESTION
    // =================================

    timeoutRef.current = setTimeout(() => {
      const nextQuestionNumber = currentQuestion + 1;

      // =================================
      // Q2-Q10
      // ML / RULE BASED ADAPTATION
      // =================================

      setUsedQuestions((prevUsed) => {
        const nextKey = getNextAdaptiveQuestion(nextDifficulty, prevUsed);

        if (!nextKey) {
          setGameRunning(false);

          const finalScore = correctAttemptsRef.current;

          saveGameResult(finalScore);

          setFinished(true);

          return prevUsed;
        }

        setCurrentQuestion(nextQuestionNumber);

        setCurrentQuestionKey(nextKey);

        return [...prevUsed, nextKey];
      });
    }, 700);
  }

  // =================================
  // EXIT
  // =================================

  function openExitPopup() {
    setShowExitPopup(true);
  }

  function cancelExit() {
    setShowExitPopup(false);
  }

  function confirmExit() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    navigate("/games");
  }

  // =================================
  // IMAGE ERROR
  // =================================

  function handleImageError(questionNumber, imageNumber) {
    const key = `${questionNumber}-${imageNumber}`;

    setImageErrors((prev) => ({
      ...prev,
      [key]: true,
    }));
  }

  // =================================
  // RESULT SCREEN
  // =================================

  if (finished) {
    return (
      <div className="routine-page">
        <div className="routine-result">
          <div className="routine-result-icon">✓</div>

          <h2>Well Done!</h2>

          <p className="routine-result-subtitle">
            You completed the game successfully.
          </p>

          <button
            className="routine-main-menu"
            onClick={() => navigate("/games")}
          >
            Go to Main Menu
          </button>
        </div>
      </div>
    );
  }

  // =================================
  // GAME SCREEN
  // =================================

  return (
    <div className="routine-page">
      <div className="routine-game">
        <div className="routine-header">
          <button
            className="routine-home-button"
            onClick={openExitPopup}
            aria-label="Exit game"
          >
            ←
          </button>

          <div className="routine-question-number">
            Question {currentQuestion} of {TOTAL_QUESTIONS}
          </div>
        </div>

        <h1 className="routine-question">Find the one that is different</h1>

        <div className="routine-options">
          {shuffledOptions.map((imageIndex) => {
            const imageNumber = imageIndex + 1;

            const errorKey = `${question.id}-${imageNumber}`;

            const isSelected = selectedOption === imageIndex;

            const isCorrect = isSelected && imageIndex === question.answer;

            return (
              <button
                key={imageIndex}
                className={`
                    routine-option
                    ${isSelected ? "selected" : ""}
                    ${isCorrect ? "correct" : ""}
                  `}
                onClick={() => handleAnswer(imageIndex)}
                disabled={answerLocked}
              >
                {!imageErrors[errorKey] ? (
                  <img
                    src={question.images[imageIndex]}
                    alt={`Option ${imageNumber}`}
                    onError={() => handleImageError(question.id, imageNumber)}
                  />
                ) : (
                  <div className="routine-image-error">Image not found</div>
                )}
              </button>
            );
          })}
        </div>

        <button className="routine-exit-button" onClick={openExitPopup}>
          <span>🚪</span>
          Exit
        </button>
      </div>

      {/* =================================
          EXIT POPUP
      ================================= */}

      {showExitPopup && (
        <div className="routine-overlay">
          <div className="routine-exit-popup">
            <h2>Exit Game?</h2>

            <p>Are you sure you want to leave?</p>

            <div className="routine-popup-buttons">
              <button className="routine-cancel" onClick={cancelExit}>
                Cancel
              </button>

              <button className="routine-confirm" onClick={confirmExit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
