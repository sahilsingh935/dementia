import {
  getUnsyncedRecognitionResults,
  markRecognitionResultSynced,
} from "./recognitionDb";

const API_URL = "http://localhost:5000/api/recognition";

// ======================================
// GET AUTH
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
// SYNC RECOGNITION RESULTS
// ======================================

export async function syncRecognitionResults() {
  // Offline
  if (!navigator.onLine) {
    console.log("Offline - Recognition sync skipped.");
    return;
  }

  // ======================================
  // AUTHENTICATION
  // ======================================

  const { token, role, userId } = getAuth();

  // Sirf logged-in patient sync karega
  if (!token || role !== "patient" || !userId) {
    console.log("No authenticated patient session - Recognition sync skipped.");
    return;
  }

  try {
    // ======================================
    // GET UNSYNCED RESULTS
    // ======================================

    const results = await getUnsyncedRecognitionResults();

    if (results.length === 0) {
      console.log("No unsynced recognition results.");
      return;
    }

    // ======================================
    // CURRENT PATIENT ONLY
    // ======================================

    const patientResults = results.filter(
      (result) => result.patientKey === userId,
    );

    if (patientResults.length === 0) {
      console.log("No unsynced recognition results for current patient.");
      return;
    }

    console.log(`Syncing ${patientResults.length} recognition result(s)...`);

    // ======================================
    // SYNC EACH RESULT
    // ======================================

    for (const result of patientResults) {
      try {
        /*
         * IndexedDB-only fields remove karo.
         *
         * patientKey backend ko nahi bhejna.
         * Backend JWT se patient ID lega.
         */

        const { id, synced, patientKey, ...data } = result;

        const response = await fetch(`${API_URL}/save`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            // JWT authentication
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(data),
        });

        // ======================================
        // AUTH EXPIRED
        // ======================================

        if (response.status === 401) {
          throw new Error("Authentication expired");
        }

        // ======================================
        // PERMISSION DENIED
        // ======================================

        if (response.status === 403) {
          throw new Error("Permission denied");
        }

        // ======================================
        // SERVER ERROR
        // ======================================

        if (!response.ok) {
          let errorMessage = `Server returned ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON response unavailable
          }

          throw new Error(errorMessage);
        }

        // ======================================
        // SUCCESS
        // ======================================

        /*
         * MongoDB mein successfully save hone
         * ke baad hi IndexedDB record synced hoga.
         */

        await markRecognitionResultSynced(id);

        console.log("Recognition result synced:", id);
      } catch (error) {
        console.error(
          `Failed to sync recognition result ${result.id}:`,
          error.message,
        );

        /*
         * Result delete nahi hoga.
         * synced=false rahega.
         * Next sync mein retry hoga.
         */

        continue;
      }
    }
  } catch (error) {
    console.error("Recognition sync error:", error);
  }
}

// ======================================
// AUTO SYNC
// ======================================

export function startRecognitionAutoSync() {
  // ======================================
  // 1. APP START
  // ======================================

  syncRecognitionResults();

  // ======================================
  // 2. INTERNET RESTORED
  // ======================================

  const handleOnline = () => {
    console.log("Internet restored - syncing Recognition results...");

    syncRecognitionResults();
  };

  window.addEventListener("online", handleOnline);

  // ======================================
  // 3. EVERY 30 SECONDS
  // ======================================

  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncRecognitionResults();
    }
  }, 30000);

  // ======================================
  // CLEANUP
  // ======================================

  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
