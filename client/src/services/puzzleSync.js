import { getUnsyncedPuzzleResults, markPuzzleSynced } from "./puzzleDb";

const API_URL = "http://localhost:5000/api/puzzle/save";

// ========================================
// SYNC PUZZLE RESULTS
// ========================================

export async function syncPuzzleResults() {
  // Offline hai toh sync mat karo
  if (!navigator.onLine) {
    console.log("Puzzle: Offline - sync skipped");

    return;
  }

  try {
    const results = await getUnsyncedPuzzleResults();

    // Kuch sync karne ke liye nahi hai
    if (results.length === 0) {
      console.log("Puzzle: No data to sync");

      return;
    }

    for (const result of results) {
      const { id, synced, createdAt, ...gameData } = result;

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        throw new Error("Failed to sync Puzzle result");
      }

      // MongoDB mein save hone ke baad
      // IndexedDB record ko synced mark karo
      await markPuzzleSynced(id);

      console.log("Puzzle result synced:", id);
    }
  } catch (error) {
    console.error("Puzzle sync error:", error);
  }
}

// ========================================
// AUTO SYNC
// ========================================

export function startPuzzleAutoSync() {
  // App start hote hi ek baar sync
  syncPuzzleResults();

  // Internet wapas aane par sync
  const handleOnline = () => {
    console.log("Online - syncing Puzzle...");

    syncPuzzleResults();
  };

  window.addEventListener("online", handleOnline);

  // Har 30 seconds check
  const interval = setInterval(() => {
    syncPuzzleResults();
  }, 30000);

  // Cleanup
  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
