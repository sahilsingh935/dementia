import React, { useEffect, useRef, useState } from "react";

import "./AttentionGame.css";

import { savePuzzleResult } from "../../services/puzzleDb";

// =====================================================
// IMAGE LOADING
// =====================================================

const imageModules = import.meta.glob(
  "../../assets/puzzle/**/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// =====================================================
// LEVEL CONFIG
// =====================================================

const levelConfig = {
  1: {
    rows: 2,
    cols: 2,
    observationTime: 8,
  },

  2: {
    rows: 2,
    cols: 3,
    observationTime: 8,
  },

  3: {
    rows: 3,
    cols: 3,
    observationTime: 10,
  },

  4: {
    rows: 3,
    cols: 4,
    observationTime: 10,
  },

  5: {
    rows: 4,
    cols: 4,
    observationTime: 12,
  },
};

// =====================================================
// GAME
// =====================================================

function AttentionGame() {
  // Currently hardcoded
  const selectedState = "Assam";

  // ===================================================
  // STATE
  // ===================================================

  const [level, setLevel] = useState(1);

  const [image, setImage] = useState(null);

  const [phase, setPhase] = useState("observation");

  const [pieces, setPieces] = useState([]);

  const [selectedPiece, setSelectedPiece] = useState(null);

  const [showHint, setShowHint] = useState(false);

  const [difficultyChange, setDifficultyChange] = useState("SAME");

  const [isChangingLevel, setIsChangingLevel] = useState(false);

  // ===================================================
  // REFS
  // ===================================================

  const lastImageRef = useRef(null);

  const observationTimerRef = useRef(null);

  const levelTransitionRef = useRef(null);

  const puzzleStartTimeRef = useRef(null);

  const attemptsRef = useRef(0);

  const mistakesRef = useRef(0);

  const previousScoreRef = useRef(0);

  const draggedPieceRef = useRef(null);

  // ===================================================
  // GET STATE IMAGES
  // ===================================================

  const getStateImages = (state) => {
    const images = [];

    for (let i = 1; i <= 11; i++) {
      const found = Object.entries(imageModules).find(([path]) => {
        return (
          path.includes(`/${state}/`) &&
          path.match(new RegExp(`/${i}\\.(png|jpg|jpeg|webp)$`, "i"))
        );
      });

      if (found) {
        images.push(found[1]);
      }
    }

    return images;
  };

  // ===================================================
  // RANDOM IMAGE
  // ===================================================

  const getRandomImage = () => {
    const images = getStateImages(selectedState);

    if (images.length === 0) {
      console.error(`No puzzle images found for ${selectedState}`);

      return null;
    }

    let availableImages = images.filter((img) => img !== lastImageRef.current);

    if (availableImages.length === 0) {
      availableImages = images;
    }

    const randomImage =
      availableImages[Math.floor(Math.random() * availableImages.length)];

    lastImageRef.current = randomImage;

    return randomImage;
  };

  // ===================================================
  // CREATE PUZZLE
  // ===================================================

  const createPuzzle = (puzzleImage, levelNumber) => {
    const config = levelConfig[levelNumber];

    const totalPieces = config.rows * config.cols;

    const shuffledPositions = Array.from(
      {
        length: totalPieces,
      },
      (_, index) => index,
    );

    // Shuffle
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffledPositions[i], shuffledPositions[j]] = [
        shuffledPositions[j],
        shuffledPositions[i],
      ];
    }

    // Never start with completely solved puzzle
    if (
      totalPieces > 1 &&
      shuffledPositions.every((value, index) => value === index)
    ) {
      [shuffledPositions[0], shuffledPositions[1]] = [
        shuffledPositions[1],
        shuffledPositions[0],
      ];
    }

    const newPieces = shuffledPositions.map((correctPosition, index) => {
      const correctRow = Math.floor(correctPosition / config.cols);

      const correctCol = correctPosition % config.cols;

      return {
        id: index,

        currentPosition: index,

        correctPosition,

        correctRow,

        correctCol,

        locked: false,
      };
    });

    setPieces(newPieces);

    setImage(puzzleImage);

    setPhase("puzzle");

    setSelectedPiece(null);

    setShowHint(false);

    attemptsRef.current = 0;

    mistakesRef.current = 0;

    puzzleStartTimeRef.current = Date.now();
  };

  // ===================================================
  // START LEVEL
  // ===================================================

  const startLevel = (levelNumber) => {
    const safeLevel = Math.min(5, Math.max(1, levelNumber));

    const randomImage = getRandomImage();

    if (!randomImage) {
      return;
    }

    clearTimeout(observationTimerRef.current);

    setLevel(safeLevel);

    setPhase("observation");

    setImage(randomImage);

    setPieces([]);

    setSelectedPiece(null);

    setShowHint(false);

    setDifficultyChange("SAME");

    setIsChangingLevel(false);

    const config = levelConfig[safeLevel];

    observationTimerRef.current = setTimeout(() => {
      createPuzzle(randomImage, safeLevel);
    }, config.observationTime * 1000);
  };

  // ===================================================
  // INITIAL GAME
  // ===================================================

  useEffect(() => {
    startLevel(1);

    return () => {
      clearTimeout(observationTimerRef.current);

      clearTimeout(levelTransitionRef.current);
    };
  }, []);

  // ===================================================
  // ML PREDICTION
  // ===================================================

  const getDifficultyPrediction = async (gameData) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/puzzle/difficulty/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(gameData),
        },
      );

      if (!response.ok) {
        throw new Error("Puzzle ML API failed");
      }

      const data = await response.json();

      if (!data.success || !data.difficulty_change) {
        return "SAME";
      }

      return data.difficulty_change;
    } catch (error) {
      console.error("Puzzle ML error:", error);

      // Offline fallback
      return "SAME";
    }
  };

  // ===================================================
  // SAVE RESULT
  // ===================================================

  const saveCompletedResult = async (
    finalAttempts,
    finalMistakes,
    finalDifficulty,
  ) => {
    const config = levelConfig[level];

    const totalPieces = config.rows * config.cols;

    const accuracy = (totalPieces / (totalPieces + finalMistakes)) * 100;

    const responseTime = (Date.now() - puzzleStartTimeRef.current) / 1000;

    const extraAttempts = Math.max(0, finalAttempts - totalPieces);

    const score = Math.max(
      0,
      Math.round(100 - finalMistakes * 5 - extraAttempts * 2),
    );

    const puzzleData = {
      level,

      rows: config.rows,

      cols: config.cols,

      puzzlePieces: totalPieces,

      attempts: finalAttempts,

      mistakes: finalMistakes,

      accuracy: Number(accuracy.toFixed(2)),

      responseTime: Number(responseTime.toFixed(2)),

      score,

      previousScore: previousScoreRef.current,

      difficultyChange: finalDifficulty,
    };

    try {
      await savePuzzleResult(puzzleData);

      console.log("Puzzle result saved:", puzzleData);
    } catch (error) {
      console.error("Puzzle save error:", error);
    }

    previousScoreRef.current = score;

    return {
      accuracy,
      responseTime,
      score,
    };
  };

  // ===================================================
  // AUTOMATIC LEVEL CHANGE
  // ===================================================

  const moveAutomatically = (difficulty) => {
    let newLevel = level;

    if (difficulty === "HARDER") {
      newLevel = Math.min(5, level + 1);
    }

    if (difficulty === "EASIER") {
      newLevel = Math.max(1, level - 1);
    }

    // SAME = same level

    setIsChangingLevel(true);

    levelTransitionRef.current = setTimeout(() => {
      startLevel(newLevel);
    }, 700);
  };

  // ===================================================
  // SWAP PIECES
  // ===================================================

  const swapPieces = async (firstIndex, secondIndex) => {
    if (firstIndex === secondIndex) {
      return;
    }

    const firstPiece = pieces[firstIndex];

    const secondPiece = pieces[secondIndex];

    if (!firstPiece || !secondPiece) {
      return;
    }

    // Locked pieces cannot move
    if (firstPiece.locked || secondPiece.locked) {
      return;
    }

    const updatedPieces = [...pieces];

    updatedPieces[firstIndex] = {
      ...secondPiece,

      currentPosition: firstIndex,
    };

    updatedPieces[secondIndex] = {
      ...firstPiece,

      currentPosition: secondIndex,
    };

    // -----------------------------------------------
    // ATTEMPT
    // -----------------------------------------------

    attemptsRef.current += 1;

    // -----------------------------------------------
    // CHECK NEWLY CORRECT PIECES
    // -----------------------------------------------

    let newlyLocked = 0;

    const lockedPieces = updatedPieces.map((piece) => {
      if (!piece.locked && piece.currentPosition === piece.correctPosition) {
        newlyLocked++;

        return {
          ...piece,
          locked: true,
        };
      }

      return piece;
    });

    // -----------------------------------------------
    // WRONG SWAP = MISTAKE
    // -----------------------------------------------

    if (newlyLocked === 0) {
      mistakesRef.current += 1;
    }

    setPieces(lockedPieces);

    // -----------------------------------------------
    // CHECK COMPLETION
    // -----------------------------------------------

    const completed = lockedPieces.every((piece) => piece.locked);

    if (!completed) {
      return;
    }

    // ===============================================
    // METRICS
    // ===============================================

    const config = levelConfig[level];

    const totalPieces = config.rows * config.cols;

    const accuracy = (totalPieces / (totalPieces + mistakesRef.current)) * 100;

    const responseTime = (Date.now() - puzzleStartTimeRef.current) / 1000;

    // ===============================================
    // ML
    // ===============================================

    const prediction = await getDifficultyPrediction({
      puzzle_pieces: totalPieces,

      accuracy: Number(accuracy.toFixed(2)),

      response_time: Number(responseTime.toFixed(2)),

      attempts: attemptsRef.current,

      mistakes: mistakesRef.current,

      previous_score: previousScoreRef.current,

      current_level: level,
    });

    // ===============================================
    // FINAL DIFFICULTY
    // ===============================================
    // IMPORTANT:
    // Do NOT convert HARDER at Level 5 to SAME.
    // moveAutomatically() handles the Level 5 boundary.

    const finalDifficulty = prediction;

    console.log("Puzzle ML Prediction:", finalDifficulty);

    // ===============================================
    // SAVE
    // ===============================================

    await saveCompletedResult(
      attemptsRef.current,
      mistakesRef.current,
      finalDifficulty,
    );

    // ===============================================
    // AUTOMATIC NEXT PUZZLE
    // ===============================================

    setDifficultyChange(finalDifficulty);

    moveAutomatically(finalDifficulty);
  };

  // ===================================================
  // CLICK TO SWAP
  // ===================================================

  const handlePieceClick = (index) => {
    if (pieces[index]?.locked) {
      return;
    }

    if (selectedPiece === null) {
      setSelectedPiece(index);

      return;
    }

    if (selectedPiece === index) {
      setSelectedPiece(null);

      return;
    }

    swapPieces(selectedPiece, index);

    setSelectedPiece(null);
  };

  // ===================================================
  // DRAG START
  // ===================================================

  const handleDragStart = (e, index) => {
    if (pieces[index]?.locked) {
      e.preventDefault();

      return;
    }

    draggedPieceRef.current = index;

    e.dataTransfer.effectAllowed = "move";
  };

  // ===================================================
  // DROP
  // ===================================================

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();

    const sourceIndex = draggedPieceRef.current;

    if (sourceIndex === null || sourceIndex === undefined) {
      return;
    }

    if (sourceIndex === targetIndex) {
      draggedPieceRef.current = null;

      return;
    }

    swapPieces(sourceIndex, targetIndex);

    draggedPieceRef.current = null;
  };

  // ===================================================
  // CONFIG
  // ===================================================

  const config = levelConfig[level];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="puzzle-container">
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="puzzle-header">
        <div className="game-label">SMRITISETU</div>

        <h1>Puzzle Game</h1>

        <p>Recreate the picture</p>
      </div>

      {/* ========================================= */}
      {/* OBSERVATION */}
      {/* ========================================= */}

      {phase === "observation" && (
        <div className="observation-card">
          <div className="section-heading">
            <span className="section-number">1</span>

            <div>
              <h2>Observe the picture</h2>

              <p>Look carefully and remember the picture.</p>
            </div>
          </div>

          <div className="reference-image-box">
            {image && (
              <img src={image} alt="Reference" className="reference-image" />
            )}
          </div>

          <p className="observation-message">
            Take your time. There is no need to hurry.
          </p>
        </div>
      )}

      {/* ========================================= */}
      {/* PUZZLE */}
      {/* ========================================= */}

      {phase === "puzzle" && (
        <div className="puzzle-card">
          <div className="puzzle-card-header">
            <div className="section-heading">
              <span className="section-number">2</span>

              <div>
                <h2>Recreate the picture</h2>

                <p>Click two pieces to swap them or drag a piece.</p>
              </div>
            </div>
          </div>

          <div className="puzzle-game-area">
            {/* ================================= */}
            {/* HINT */}
            {/* ================================= */}

            <div className="hint-side-box">
              {!showHint ? (
                <button
                  className="hint-button"
                  onClick={() => setShowHint(true)}
                >
                  Hint
                </button>
              ) : (
                <div className="hint-card">
                  {image && (
                    <img src={image} alt="Hint" className="hint-image" />
                  )}

                  <button
                    className="hint-close"
                    onClick={() => setShowHint(false)}
                  >
                    Hide
                  </button>
                </div>
              )}
            </div>

            {/* ================================= */}
            {/* PUZZLE BOARD */}
            {/* ================================= */}

            <div
              className="puzzle-board"
              style={{
                "--cols": config.cols,
                "--rows": config.rows,
              }}
            >
              {pieces.map((piece, index) => (
                <div
                  key={piece.id}
                  className={`
                      puzzle-piece
                      ${selectedPiece === index ? "selected-piece" : ""}
                      ${piece.locked ? "locked-piece" : ""}
                    `}
                  onClick={() => handlePieceClick(index)}
                  draggable={!piece.locked}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {image && (
                    <img
                      src={image}
                      alt=""
                      draggable={false}
                      style={{
                        "--correct-col": piece.correctCol,
                        "--correct-row": piece.correctRow,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* AUTOMATIC TRANSITION */}
      {/* ========================================= */}

      {isChangingLevel && (
        <div className="level-transition">
          <div className="transition-spinner">
            <span></span>
          </div>

          <p>
            {difficultyChange === "HARDER"
              ? "Great work! Let's try a little more."
              : difficultyChange === "EASIER"
                ? "Let's try a simpler puzzle."
                : "Let's try another puzzle."}
          </p>
        </div>
      )}
    </div>
  );
}

export default AttentionGame;
