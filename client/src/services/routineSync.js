import {
  getUnsyncedRoutineResults,
  markRoutineResultSynced,
} from "./routineDb";

const API_URL = "http://localhost:5000/api/routine";

let syncing = false;

export async function syncRoutineResults() {
  if (syncing) return;

  if (!navigator.onLine) {
    return;
  }

  syncing = true;

  try {
    const results = await getUnsyncedRoutineResults();

    if (!results.length) {
      return;
    }

    for (const result of results) {
      try {
        const response = await fetch(`${API_URL}/results`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        await markRoutineResultSynced(result.id);

        console.log("Routine result synced:", result.id);
      } catch (error) {
        console.error("Routine result sync failed:", error);

        // Internet/server problem:
        // result IndexedDB mein unsynced hi rahega.
      }
    }
  } catch (error) {
    console.error("Routine sync error:", error);
  } finally {
    syncing = false;
  }
}

export function startRoutineAutoSync() {
  // Initial sync
  syncRoutineResults();

  // Internet wapas aane par sync
  window.addEventListener("online", syncRoutineResults);

  // Har 30 seconds mein check
  const interval = setInterval(syncRoutineResults, 30000);

  return () => {
    window.removeEventListener("online", syncRoutineResults);

    clearInterval(interval);
  };
}
