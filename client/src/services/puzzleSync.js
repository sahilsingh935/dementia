import { getUnsyncedPuzzleResults, markPuzzleSynced } from "./puzzleDb";

const API_URL = "http://localhost:5000/api/puzzle/save";

// ========================================
// AUTH HELPERS
// ========================================

function getAuth() {
  const token =
    localStorage.getItem("manasToken") ||
    sessionStorage.getItem("manasToken") ||
    null;

  const role =
    localStorage.getItem("manasRole") ||
    sessionStorage.getItem("manasRole") ||
    null;

  const userId =
    localStorage.getItem("manasUserId") ||
    sessionStorage.getItem("manasUserId") ||
    null;

  return {
    token,
    role,
    userId,
  };
}

// ========================================
// SYNC PUZZLE RESULTS
// ========================================

export async function syncPuzzleResults() {
  // Offline hai toh sync mat karo
  if (!navigator.onLine) {
    console.log("Puzzle: Offline - sync skipped");

    return;
  }

  const { token, role, userId } = getAuth();

  // Sirf authenticated patient sync karega
  if (!token || role !== "patient" || !userId) {
    console.log("Puzzle: No authenticated patient session - sync skipped");

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
      try {
        // ========================================
        // EXTRA PATIENT SAFETY
        // ========================================

        if (result.patientKey !== userId) {
          console.warn(
            "Puzzle: Skipping result belonging to another patient:",
            result.id,
          );

          continue;
        }

        // ========================================
        // REMOVE LOCAL-ONLY FIELDS
        // ========================================

        const { id, synced, patientKey, createdAt, ...gameData } = result;

        // ========================================
        // SEND TO BACKEND
        // ========================================

        const response = await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          /*
           * patientId frontend se nahi bhej rahe.
           *
           * Backend JWT se:
           * req.user.id
           *
           * use karega.
           */
          body: JSON.stringify(gameData),
        });

        // ========================================
        // AUTH ERROR
        // ========================================

        if (response.status === 401) {
          throw new Error("Authentication expired");
        }

        // ========================================
        // PERMISSION ERROR
        // ========================================

        if (response.status === 403) {
          throw new Error("Permission denied");
        }

        // ========================================
        // OTHER SERVER ERROR
        // ========================================

        if (!response.ok) {
          let errorMessage = `Server returned ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON response available nahi hai
          }

          throw new Error(errorMessage);
        }

        // ========================================
        // MARK AS SYNCED
        // ========================================

        await markPuzzleSynced(id);

        console.log("Puzzle result synced:", id);
      } catch (error) {
        console.error(
          `Puzzle result sync failed for ${result.id}:`,
          error.message,
        );

        /*
         * Failed result IndexedDB mein
         * unsynced hi rahega.
         *
         * Next sync mein dobara try hoga.
         */
      }
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
    if (navigator.onLine) {
      syncPuzzleResults();
    }
  }, 30000);

  // Cleanup
  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
