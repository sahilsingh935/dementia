import { useNavigate } from "react-router-dom";

function Games() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Cognitive Games</h1>

      <p>Choose a game to play</p>

      <button onClick={() => navigate("/games/memory")}>
        🧠 Memory
      </button>

      <button onClick={() => navigate("/games/attention")}>
        🎯 Attention & Concentration
      </button>

      <button onClick={() => navigate("/games/routine")}>
        📅 Daily Routine Recall
      </button>

      <button onClick={() => navigate("/games/recognition")}>
        🔷 Pattern & Object Recognition
      </button>
    </div>
  );
}

export default Games;