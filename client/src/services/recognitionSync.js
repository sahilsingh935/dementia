import {
  getUnsyncedRecognitionResults,
  markRecognitionResultSynced,
} from "./recognitionDb";

const API_URL = "http://localhost:5000/api/recognition";

// --------------------------------
// SYNC RECOGNITION RESULTS
// --------------------------------

export async function syncRecognitionResults() {
  if (!navigator.onLine) {
    return;
  }

  try {
    const results = await getUnsyncedRecognitionResults();

    if (results.length === 0) {
      return;
    }

    console.log(`Syncing ${results.length} recognition result(s)...`);

    for (const result of results) {
      try {
        // Remove IndexedDB-only fields
        const { id, synced, ...data } = result;

        const response = await fetch(`${API_URL}/save`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        await markRecognitionResultSynced(id);

        console.log("Recognition result synced:", id);
      } catch (error) {
        console.error("Failed to sync recognition result:", error);
      }
    }
  } catch (error) {
    console.error("Recognition sync error:", error);
  }
}

// --------------------------------
// AUTO SYNC
// --------------------------------

export function startRecognitionAutoSync() {
  // Initial sync
  syncRecognitionResults();

  // When internet comes back
  const handleOnline = () => {
    console.log("Internet restored. Syncing recognition results...");

    syncRecognitionResults();
  };

  window.addEventListener("online", handleOnline);

  // Periodic sync
  const interval = setInterval(() => {
    syncRecognitionResults();
  }, 30000);

  // Cleanup
  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
