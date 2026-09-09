import {
  getUnsyncedRecallSequenceResults,
  markRecallSequenceSynced,
} from "./recallSequenceDb";

const API_URL = "http://localhost:5000/api/recall-sequence";

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
// SYNC RECALL SEQUENCE RESULTS
// ======================================

export async function syncRecallSequenceResults() {
  // --------------------------------------
  // OFFLINE CHECK
  // --------------------------------------

  if (!navigator.onLine) {
    console.log("Offline - Recall Sequence sync skipped.");
    return;
  }

  // --------------------------------------
  // AUTH CHECK
  // --------------------------------------

  const { token, role, userId } = getAuth();

  // Sirf authenticated patient sync karega
  if (!token || role !== "patient" || !userId) {
    console.log(
      "No authenticated patient session - Recall Sequence sync skipped.",
    );
    return;
  }

  try {
    // --------------------------------------
    // GET UNSYNCED RESULTS
    // --------------------------------------

    const results = await getUnsyncedRecallSequenceResults();

    if (!results.length) {
      console.log("No unsynced Recall Sequence results.");
      return;
    }

    // --------------------------------------
    // CURRENT PATIENT ONLY
    // --------------------------------------

    const patientResults = results.filter(
      (result) => result.patientKey === userId,
    );

    if (!patientResults.length) {
      console.log("No unsynced Recall Sequence results for current patient.");
      return;
    }

    console.log(
      `Syncing ${patientResults.length} Recall Sequence result(s)...`,
    );

    // --------------------------------------
    // SYNC EACH RESULT
    // --------------------------------------

    for (const result of patientResults) {
      try {
        /*
         * IndexedDB ke internal fields
         * backend ko nahi bhejne.
         *
         * patientId backend JWT se
         * automatically determine karega.
         */

        const { id, synced, patientKey, createdAt, ...gameData } = result;

        // --------------------------------------
        // API REQUEST
        // --------------------------------------

        const response = await fetch(`${API_URL}/save`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(gameData),
        });

        // --------------------------------------
        // AUTH EXPIRED
        // --------------------------------------

        if (response.status === 401) {
          throw new Error("Authentication expired");
        }

        // --------------------------------------
        // PERMISSION DENIED
        // --------------------------------------

        if (response.status === 403) {
          throw new Error("Permission denied");
        }

        // --------------------------------------
        // SERVER ERROR
        // --------------------------------------

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

        // --------------------------------------
        // SUCCESS
        // --------------------------------------

        /*
         * Backend mein successfully save
         * hone ke baad hi synced=true.
         */

        await markRecallSequenceSynced(id);

        console.log(`Recall Sequence result ${id} synced successfully.`);
      } catch (error) {
        console.error(
          `Failed to sync Recall Sequence result ${result.id}:`,
          error.message,
        );

        /*
         * Result IndexedDB se delete nahi hoga.
         * synced=false rahega.
         * Next sync mein retry hoga.
         */

        continue;
      }
    }
  } catch (error) {
    console.error("Recall Sequence sync error:", error);
  }
}

// ======================================
// AUTOMATIC SYNC
// ======================================

export function startRecallSequenceAutoSync() {
  // --------------------------------------
  // 1. APP START
  // --------------------------------------

  syncRecallSequenceResults();

  // --------------------------------------
  // 2. INTERNET RESTORED
  // --------------------------------------

  const handleOnline = () => {
    console.log("Internet restored - syncing Recall Sequence...");

    syncRecallSequenceResults();
  };

  window.addEventListener("online", handleOnline);

  // --------------------------------------
  // 3. EVERY 30 SECONDS
  // --------------------------------------

  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncRecallSequenceResults();
    }
  }, 30000);

  // --------------------------------------
  // CLEANUP
  // --------------------------------------

  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
