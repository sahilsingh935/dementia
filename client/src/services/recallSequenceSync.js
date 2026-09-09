import {
  getUnsyncedRecognitionResults,
  markRecognitionResultSynced,
} from "./recognitionDb";

const API_URL = "http://localhost:5000/api/recognition";

// ======================================
// SYNC RECOGNITION RESULTS
// ======================================

export async function syncRecognitionResults() {
  // Internet nahi hai
  if (!navigator.onLine) {
    console.log("Offline - Recognition results will sync later.");
    return;
  }

  try {
    const results = await getUnsyncedRecognitionResults();

    if (results.length === 0) {
      console.log("No unsynced recognition results.");
      return;
    }

    console.log(`Syncing ${results.length} recognition result(s)...`);

    for (const result of results) {
      try {
        // IndexedDB ke internal fields remove karo
        const { id, synced, ...data } = result;

        const response = await fetch(`${API_URL}/save`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        // MongoDB mein successfully save hone ke baad
        // IndexedDB mein synced = true
        await markRecognitionResultSynced(id);

        console.log(`Recognition result ${id} synced successfully.`);
      } catch (error) {
        console.error(`Failed to sync recognition result ${result.id}:`, error);

        // Agar ek result fail hua,
        // baaki results ko try karenge
        continue;
      }
    }
  } catch (error) {
    console.error("Recognition sync error:", error);
  }
}

// ======================================
// AUTOMATIC SYNC
// ======================================

export function startRecognitionAutoSync() {
  // App start hote hi sync try karo
  syncRecognitionResults();

  // Internet wapas aane par sync
  const handleOnline = () => {
    console.log("Internet restored.");

    syncRecognitionResults();
  };

  window.addEventListener("online", handleOnline);

  // Har 30 seconds mein check
  const interval = setInterval(() => {
    syncRecognitionResults();
  }, 30000);

  // Cleanup
  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
