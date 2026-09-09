import {
  getUnsyncedRoutineResults,
  markRoutineResultSynced,
} from "./routineDb";

const API_URL = "http://localhost:5000/api/routine";

let syncing = false;

// ======================================
// AUTH HELPERS
// ======================================

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

// ======================================
// SYNC ROUTINE RESULTS
// ======================================

export async function syncRoutineResults() {
  if (syncing) return;

  if (!navigator.onLine) {
    console.log("Offline - Routine sync skipped");
    return;
  }

  const { token, role, userId } = getAuth();

  // Only authenticated patients can sync
  if (!token || role !== "patient" || !userId) {
    console.log("No authenticated patient session - Routine sync skipped");
    return;
  }

  syncing = true;

  try {
    const results = await getUnsyncedRoutineResults();

    if (!results.length) {
      console.log("No unsynced Routine results");
      return;
    }

    for (const result of results) {
      try {
        /*
         * Extra safety:
         * only sync current patient's result.
         */
        if (result.patientKey !== userId) {
          console.warn(
            "Skipping Routine result belonging to another patient:",
            result.id,
          );
          continue;
        }

        const response = await fetch(`${API_URL}/results`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          /*
           * patientId is NOT trusted from here.
           * Backend gets patientId from JWT.
           */
          body: JSON.stringify(result),
        });

        // ======================================
        // AUTH EXPIRED
        // ======================================

        if (response.status === 401) {
          throw new Error("Authentication expired");
        }

        // ======================================
        // NOT ALLOWED
        // ======================================

        if (response.status === 403) {
          throw new Error("Permission denied");
        }

        // ======================================
        // OTHER SERVER ERROR
        // ======================================

        if (!response.ok) {
          let errorMessage = `Server returned ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // Response JSON unavailable
          }

          throw new Error(errorMessage);
        }

        // ======================================
        // MARK AS SYNCED
        // ======================================

        await markRoutineResultSynced(result.id);

        console.log("Routine result synced:", result.id);
      } catch (error) {
        console.error(
          `Routine result sync failed for ${result.id}:`,
          error.message,
        );

        /*
         * Result IndexedDB mein unsynced rahega.
         * Next sync attempt mein dobara try hoga.
         */
      }
    }
  } catch (error) {
    console.error("Routine sync error:", error);
  } finally {
    syncing = false;
  }
}

// ======================================
// AUTO SYNC
// ======================================

export function startRoutineAutoSync() {
  // Initial sync
  syncRoutineResults();

  // Internet wapas aane par
  window.addEventListener("online", syncRoutineResults);

  // Har 30 seconds
  const interval = setInterval(syncRoutineResults, 30000);

  return () => {
    window.removeEventListener("online", syncRoutineResults);

    clearInterval(interval);
  };
}
