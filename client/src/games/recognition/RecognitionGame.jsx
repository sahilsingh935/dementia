import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./RecognitionGame.css";

import { saveRecognitionResult } from "../../services/recognitionDb";

// --------------------------------
// IMAGE LOADING
// --------------------------------

const imageModules = import.meta.glob(
  "../../assets/recognition/assam/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

function getImage(fileName) {
  if (!fileName) return "";

  const target = fileName
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .toLowerCase()
    .trim();

  const foundKey = Object.keys(imageModules).find((key) => {
    const actualFileName = key
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      .replace(/\.(jpg|jpeg|png|webp)$/i, "")
      .toLowerCase()
      .trim();

    return actualFileName === target;
  });

  return foundKey ? imageModules[foundKey] : "";
}

// --------------------------------
// SHUFFLE
// --------------------------------

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// --------------------------------
// QUESTION BANK
// --------------------------------

const questionBank = {
  Assam: [
    {
      category: "Food",
      question: "Which of these is a traditional Assamese drink?",
      hint: "It is a popular drink made from tea leaves.",
      difficulty: "easy",
      options: [
        {
          label: "Assam Tea",
          value: "assam_tea",
          image: "assam_tea",
        },
        {
          label: "Bihu",
          value: "bihu",
          image: "bihu",
        },
        {
          label: "Gamosa",
          value: "gamosa",
          image: "gamosa",
        },
      ],
      answer: "assam_tea",
    },

    {
      category: "Food",
      question: "Which image shows an Assamese traditional meal?",
      hint: "Look for a meal served with several traditional dishes.",
      difficulty: "easy",
      options: [
        {
          label: "Assamese Thali",
          value: "assamese_thali",
          image: "assamese_thali",
        },
        {
          label: "Brahmaputra",
          value: "brahmaputra",
          image: "brahmaputra",
        },
        {
          label: "Bihu Dance",
          value: "bihu_dance",
          image: "bihu_dance",
        },
      ],
      answer: "assamese_thali",
    },

    {
      category: "Festival",
      question: "Which festival is strongly associated with Assam?",
      hint: "It is one of the most important festivals of Assam.",
      difficulty: "easy",
      options: [
        {
          label: "Bihu",
          value: "bihu",
          image: "bihu",
        },
        {
          label: "Pitha",
          value: "pitha",
          image: "pitha",
        },
        {
          label: "Gamosa",
          value: "gamosa",
          image: "gamosa",
        },
      ],
      answer: "bihu",
    },

    {
      category: "Culture",
      question:
        "Which image shows people performing a traditional Assamese dance?",
      hint: "Look at the group of people dressed traditionally.",
      difficulty: "easy",
      options: [
        {
          label: "Bihu Dance",
          value: "bihu_dance",
          image: "bihu_dance",
        },
        {
          label: "Jolpan",
          value: "jolpan",
          image: "jolpan",
        },
        {
          label: "Kaziranga",
          value: "kaziranga",
          image: "kaziranga",
        },
      ],
      answer: "bihu_dance",
    },

    {
      category: "Nature",
      question: "Which famous river is associated with Assam?",
      hint: "It is one of the major rivers flowing through Assam.",
      difficulty: "easy",
      options: [
        {
          label: "Brahmaputra",
          value: "brahmaputra",
          image: "brahmaputra",
        },
        {
          label: "Pitha",
          value: "pitha",
          image: "pitha",
        },
        {
          label: "Gamosa",
          value: "gamosa",
          image: "gamosa",
        },
      ],
      answer: "brahmaputra",
    },

    {
      category: "Culture",
      question: "Which traditional Assamese cloth is shown in the image?",
      hint: "It is a well-known symbol of Assamese culture.",
      difficulty: "easy",
      options: [
        {
          label: "Gamosa",
          value: "gamosa",
          image: "gamosa",
        },
        {
          label: "Kaziranga",
          value: "kaziranga",
          image: "kaziranga",
        },
        {
          label: "Assam Tea",
          value: "assam_tea",
          image: "assam_tea",
        },
      ],
      answer: "gamosa",
    },

    {
      category: "Food",
      question: "Which image shows a traditional Assamese snack or breakfast?",
      hint: "It is commonly associated with traditional Assamese food.",
      difficulty: "medium",
      options: [
        {
          label: "Jolpan",
          value: "jolpan",
          image: "jolpan",
        },
        {
          label: "Bihu Dance",
          value: "bihu_dance",
          image: "bihu_dance",
        },
        {
          label: "Brahmaputra",
          value: "brahmaputra",
          image: "brahmaputra",
        },
      ],
      answer: "jolpan",
    },

    {
      category: "Wildlife",
      question: "Which famous national park is represented in this image?",
      hint: "It is famous for the one-horned rhinoceros.",
      difficulty: "medium",
      options: [
        {
          label: "Kaziranga",
          value: "kaziranga",
          image: "kaziranga",
        },
        {
          label: "Majuli",
          value: "majuli",
          image: "brahmaputra",
        },
        {
          label: "Bihu",
          value: "bihu",
          image: "bihu",
        },
      ],
      answer: "kaziranga",
    },

    {
      category: "Clothing",
      question: "Which traditional Assamese garment is shown here?",
      hint: "It is traditionally worn by women in Assam.",
      difficulty: "medium",
      options: [
        {
          label: "Mekhela Chador",
          value: "mekhela_chador",
          image: "mekhela_chador",
        },
        {
          label: "Gamosa",
          value: "gamosa",
          image: "gamosa",
        },
        {
          label: "Pitha",
          value: "pitha",
          image: "pitha",
        },
      ],
      answer: "mekhela_chador",
    },

    {
      category: "Wildlife",
      question: "Which animal is shown in the image?",
      hint: "This animal is strongly associated with Kaziranga.",
      difficulty: "medium",
      options: [
        {
          label: "One-horned Rhinoceros",
          value: "one_horned_rhino",
          image: "one_horned_rhino",
        },
        {
          label: "Tiger",
          value: "tiger",
          image: "kaziranga",
        },
        {
          label: "Elephant",
          value: "elephant",
          image: "brahmaputra",
        },
      ],
      answer: "one_horned_rhino",
    },

    {
      category: "Food",
      question: "Which traditional Assamese food is shown in this image?",
      hint: "It is a popular traditional rice-based preparation.",
      difficulty: "medium",
      options: [
        {
          label: "Pitha",
          value: "pitha",
          image: "pitha",
        },
        {
          label: "Gamosa",
          value: "gamosa",
          image: "gamosa",
        },
        {
          label: "Bihu",
          value: "bihu",
          image: "bihu",
        },
      ],
      answer: "pitha",
    },

    {
      category: "Food",
      question: "Which image shows a traditional Assamese food item?",
      hint: "It is associated with traditional Assamese meals.",
      difficulty: "medium",
      options: [
        {
          label: "Jolpan",
          value: "jolpan",
          image: "jolpan",
        },
        {
          label: "Mekhela Chador",
          value: "mekhela_chador",
          image: "mekhela_chador",
        },
        {
          label: "Kaziranga",
          value: "kaziranga",
          image: "kaziranga",
        },
      ],
      answer: "jolpan",
    },
  ],
};

// --------------------------------
// CREATE GAME QUESTIONS
// --------------------------------

function createGameQuestions(difficulty) {
  const bank = questionBank.Assam;

  let filteredQuestions;

  if (difficulty === "easy") {
    filteredQuestions = bank.filter(
      (question) => question.difficulty === "easy",
    );
  } else {
    filteredQuestions = bank.filter(
      (question) => question.difficulty === "medium",
    );
  }

  if (filteredQuestions.length < 6) {
    filteredQuestions = bank;
  }

  return shuffle(filteredQuestions)
    .slice(0, 6)
    .map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));
}

// --------------------------------
// COMPONENT
// --------------------------------

export default function RecognitionGame() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState("quiz");

  const [questions, setQuestions] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);

  const [showCorrect, setShowCorrect] = useState(false);

  const [wrongQuestions, setWrongQuestions] = useState([]);

  const [showHint, setShowHint] = useState(false);

  // --------------------------------
  // ML STATE
  // --------------------------------

  const [currentLevel, setCurrentLevel] = useState(1);

  const [previousScore, setPreviousScore] = useState(0);

  const [mlLoading, setMlLoading] = useState(false);

  const current = questions[currentQuestion];

  // --------------------------------
  // REFS
  // --------------------------------

  const questionAttemptsRef = useRef({});

  const gameStartTimeRef = useRef(Date.now());

  const hintUsedRef = useRef(false);

  // --------------------------------
  // INITIAL GAME
  // --------------------------------

  useEffect(() => {
    const savedScore =
      Number(localStorage.getItem("recognitionPreviousScore")) || 0;

    setPreviousScore(savedScore);

    setCurrentLevel(1);

    setQuestions(createGameQuestions("easy"));

    gameStartTimeRef.current = Date.now();

    questionAttemptsRef.current = {};

    hintUsedRef.current = false;
  }, []);

  // --------------------------------
  // EXIT
  // --------------------------------

  function handleExit() {
    navigate("/patient");
  }

  // --------------------------------
  // RECORD ATTEMPT
  // --------------------------------

  function recordAttempt(questionIndex, isCorrect) {
    const existing = questionAttemptsRef.current[questionIndex] || {
      totalAttempts: 0,
      mistakes: 0,
      correctAttempts: 0,
    };

    questionAttemptsRef.current[questionIndex] = {
      totalAttempts: existing.totalAttempts + 1,

      mistakes: existing.mistakes + (isCorrect ? 0 : 1),

      correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
    };
  }

  // --------------------------------
  // CALCULATE STATS
  // --------------------------------

  function calculateGameStats() {
    const attempts = questionAttemptsRef.current;

    let totalAttempts = 0;
    let totalMistakes = 0;
    let totalCorrectAttempts = 0;
    let correctQuestions = 0;

    Object.values(attempts).forEach((attempt) => {
      totalAttempts += attempt.totalAttempts;

      totalMistakes += attempt.mistakes;

      totalCorrectAttempts += attempt.correctAttempts;

      if (attempt.correctAttempts > 0) {
        correctQuestions++;
      }
    });

    const accuracy =
      totalAttempts > 0
        ? Math.round((totalCorrectAttempts / totalAttempts) * 100)
        : 0;

    const score =
      questions.length > 0
        ? Math.round((correctQuestions / questions.length) * 100)
        : 0;

    const responseTime = Math.round(
      (Date.now() - gameStartTimeRef.current) / 1000,
    );

    return {
      totalAttempts,
      totalMistakes,
      totalCorrectAttempts,
      correctQuestions,
      accuracy,
      score,
      responseTime,
    };
  }

  // --------------------------------
  // DIFFICULTY SCORE
  // --------------------------------

  function calculateDifficultyScore(stats) {
    return Number(
      (
        0.4 * currentLevel +
        0.3 * ((100 - stats.accuracy) / 20) +
        0.2 * (stats.responseTime / 30) +
        0.1 * stats.totalMistakes
      ).toFixed(3),
    );
  }

  // --------------------------------
  // ML API
  // --------------------------------

  async function getMLDifficulty(stats) {
    const difficultyScore = calculateDifficultyScore(stats);

    try {
      setMlLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/recognition/difficulty/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            current_level: currentLevel,

            accuracy: stats.accuracy,

            response_time: stats.responseTime,

            total_attempts: stats.totalAttempts,

            mistakes: stats.totalMistakes,

            previous_score: previousScore,

            hint_used: hintUsedRef.current ? 1 : 0,

            difficulty_score: difficultyScore,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }

      const data = await response.json();

      const prediction = data.difficulty_change || "SAME";

      console.log("Recognition ML Prediction:", prediction);

      return {
        difficultyChange: prediction,

        difficultyScore,
      };
    } catch (error) {
      console.error("Recognition ML prediction failed:", error);

      return {
        difficultyChange: "SAME",
        difficultyScore,
      };
    } finally {
      setMlLoading(false);
    }
  }

  // --------------------------------
  // SAVE GAME RESULT
  // --------------------------------

  async function saveGameResult() {
    const stats = calculateGameStats();

    const mlResult = await getMLDifficulty(stats);

    // Save score for next session
    localStorage.setItem("recognitionPreviousScore", String(stats.score));

    // Save ML prediction
    localStorage.setItem(
      "recognitionLastDifficulty",
      mlResult.difficultyChange,
    );

    try {
      await saveRecognitionResult({
        totalQuestions: questions.length,

        totalAttempts: stats.totalAttempts,

        correctAttempts: stats.totalCorrectAttempts,

        mistakes: stats.totalMistakes,

        accuracy: stats.accuracy,

        responseTime: stats.responseTime,

        questionAttempts: questionAttemptsRef.current,

        completed: true,

        previousScore: previousScore,

        currentLevel: currentLevel,

        difficultyScore: mlResult.difficultyScore,

        difficultyChange: mlResult.difficultyChange,
      });

      console.log("Recognition result saved to IndexedDB");
    } catch (error) {
      console.error("Failed to save recognition result:", error);
    }

    return mlResult;
  }

  // --------------------------------
  // OPTION SELECT
  // --------------------------------

  function handleSelectOption(value) {
    if (!current || showCorrect || mlLoading) {
      return;
    }

    const isCorrect = value === current.answer;

    recordAttempt(currentQuestion, isCorrect);

    // --------------------------------
    // CORRECT
    // --------------------------------

    if (isCorrect) {
      setSelectedOption(value);

      setShowCorrect(true);

      setTimeout(async () => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);

          setSelectedOption(null);

          setShowCorrect(false);

          setShowHint(false);

          hintUsedRef.current = false;
        } else {
          // Last question
          await saveGameResult();

          setScreen("result");
        }
      }, 700);

      return;
    }

    // --------------------------------
    // WRONG
    // --------------------------------

    setSelectedOption(value);

    setWrongQuestions((prev) => {
      const alreadyExists = prev.some(
        (item) => item.question === current.question,
      );

      if (alreadyExists) {
        return prev;
      }

      return [...prev, current];
    });
  }

  // --------------------------------
  // HINT
  // --------------------------------

  function handleHint() {
    if (showCorrect || mlLoading) {
      return;
    }

    hintUsedRef.current = true;

    setShowHint((prev) => !prev);
  }

  // --------------------------------
  // RETRY
  // --------------------------------

  function startRetry() {
    if (wrongQuestions.length === 0) {
      return;
    }

    const retryQuestions = shuffle(wrongQuestions).map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));

    setQuestions(retryQuestions);

    setCurrentQuestion(0);

    setSelectedOption(null);

    setShowCorrect(false);

    setShowHint(false);

    setWrongQuestions([]);

    questionAttemptsRef.current = {};

    hintUsedRef.current = false;

    gameStartTimeRef.current = Date.now();

    setScreen("quiz");
  }

  // --------------------------------
  // LOADING
  // --------------------------------

  if (!current && screen === "quiz") {
    return (
      <div className="recognition-container">
        <div className="recognition-loading">Loading...</div>
      </div>
    );
  }

  // --------------------------------
  // RESULT SCREEN
  // --------------------------------

  if (screen === "result") {
    return (
      <div className="recognition-container">
        <div className="recognition-result">
          <button
            type="button"
            className="recognition-exit"
            onClick={handleExit}
          >
            ← Back
          </button>

          {wrongQuestions.length > 0 ? (
            <>
              <h3 className="recognition-retry-heading">
                Let's try these again
              </h3>

              <div className="recognition-retry-list">
                {wrongQuestions.map((item, index) => (
                  <div key={index} className="recognition-retry-item">
                    {item.question}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="recognition-retry-button"
                onClick={startRetry}
              >
                Try Again
              </button>
            </>
          ) : (
            <div className="recognition-result-box">Great work!</div>
          )}

          <button
            type="button"
            className="recognition-games-button"
            onClick={handleExit}
          >
            Back to Patient Home
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------
  // QUIZ SCREEN
  // --------------------------------

  return (
    <div className="recognition-container">
      <div className="recognition-quiz">
        <div className="recognition-topbar">
          <button
            type="button"
            className="recognition-exit"
            onClick={handleExit}
          >
            ← Back
          </button>
        </div>

        <h1>Let's Remember</h1>

        <div className="recognition-progress">
          Question {currentQuestion + 1} of {questions.length}
        </div>

        <div className="recognition-question-box">
          <p>{current.question}</p>
        </div>

        <div className="recognition-options">
          {current.options.map((option) => {
            const image = getImage(option.image);

            const isSelected = selectedOption === option.value;

            const isCorrect = showCorrect && option.value === current.answer;

            return (
              <button
                type="button"
                key={option.value}
                className={[
                  "recognition-option",
                  isSelected ? "selected" : "",
                  isCorrect ? "correct" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSelectOption(option.value)}
                disabled={showCorrect || mlLoading}
              >
                {image ? (
                  <img
                    src={image}
                    alt={option.label}
                    className="recognition-option-image"
                  />
                ) : (
                  <div className="recognition-image-missing">
                    Image not found
                  </div>
                )}

                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="recognition-hint-button"
          onClick={handleHint}
          disabled={showCorrect || mlLoading}
        >
          💡 Hint
        </button>

        {showHint && (
          <div className="recognition-hint-text">{current.hint}</div>
        )}

        {showCorrect && (
          <div className="recognition-feedback success">Correct!</div>
        )}
      </div>
    </div>
  );
}
