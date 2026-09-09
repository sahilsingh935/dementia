import { dbPromise } from "./db";

const API_URL = "http://localhost:5000/api/game-results";

/*
  =========================
  GET AUTH TOKEN
  =========================
*/

function getAuthToken() {
  return (
    localStorage.getItem("manasToken") ||
    sessionStorage.getItem("manasToken") ||
    null
  );
}

/*
  =========================
  GET CURRENT USER
  =========================
*/

function getCurrentUser() {
  const token = getAuthToken();

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

/*
  =========================
  SYNC GAME RESULTS
  =========================
*/

export async function syncGameResults() {
  // Internet nahi hai toh API call mat karo
  if (!navigator.onLine) {
    console.log("Offline - sync skipped");
    return;
  }

  try {
    /*
      Current logged-in patient ki authentication
      information nikalo.
    */

    const { token, role, userId } = getCurrentUser();

    /*
      Game results sirf patient account se
      backend par save honge.
    */

    if (!token || role !== "patient" || !userId) {
      console.log("No authenticated patient session - sync skipped");
      return;
    }

    console.log(`Syncing results for patient: ${userId}`);

    const db = await dbPromise;

    /*
      =========================
      GET LOCAL RESULTS
      =========================
    */

    const results = await db.getAll("gameResults");

    /*
      IMPORTANT:

      Sirf current logged-in patient ke
      unsynced results sync honge.

      Isse ek patient ke results kisi
      doosre patient ke account mein nahi jayenge.
    */

    const unsyncedResults = results.filter(
      (result) => result.synced === false && result.patientKey === userId,
    );

    if (unsyncedResults.length === 0) {
      console.log("No unsynced results for current patient");
      return;
    }

    console.log(`${unsyncedResults.length} result(s) waiting for sync`);

    /*
      =========================
      SYNC EACH RESULT
      =========================
    */

    for (const result of unsyncedResults) {
      try {
        /*
          =========================
          SEND RESULT TO BACKEND
          =========================

          patientId frontend se nahi bhej rahe.

          Backend JWT se:
              req.user.id

          automatically patient identify karega.
        */

        const response = await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          /*
            patientKey local identification ke liye hai.

            Backend patientId ko JWT se identify karega.
          */

          body: JSON.stringify({
            ...result,
          }),
        });

        /*
          =========================
          AUTH EXPIRED
          =========================
        */

        if (response.status === 401) {
          console.warn(
            "Patient authentication expired. Result will remain unsynced.",
          );

          throw new Error("Authentication expired");
        }

        /*
          =========================
          PERMISSION DENIED
          =========================
        */

        if (response.status === 403) {
          console.warn(
            "Patient does not have permission to save game results.",
          );

          throw new Error("Permission denied");
        }

        /*
          =========================
          OTHER SERVER ERROR
          =========================
        */

        if (!response.ok) {
          let errorMessage = `Server returned ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON response nahi mila
          }

          throw new Error(errorMessage);
        }

        /*
          =========================
          SERVER SUCCESS
          =========================

          Backend ne result successfully save
          kar diya.

          Ab IndexedDB mein synced=true.
        */

        await db.put("gameResults", {
          ...result,
          synced: true,
        });

        console.log(`Game result ${result.id} synced successfully`);
      } catch (error) {
        console.error(`Failed to sync result ${result.id}:`, error.message);

        /*
          IMPORTANT:

          Failed result delete nahi hoga.

          synced:false rahega.

          Next sync mein dobara attempt hoga.
        */
      }
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

/*
  =========================
  AUTOMATIC SYNC
  =========================
*/

export function startAutoSync() {
  /*
    1. App start hote hi sync
  */

  syncGameResults();

  /*
    2. Internet wapas aate hi sync
  */

  const handleOnline = () => {
    console.log("Internet connected - syncing...");

    syncGameResults();
  };

  window.addEventListener("online", handleOnline);

  /*
    3. Har 30 seconds mein check
  */

  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncGameResults();
    }
  }, 30000);

  /*
    Cleanup
  */

  return () => {
    window.removeEventListener("online", handleOnline);

    clearInterval(interval);
  };
}
