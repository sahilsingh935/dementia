import { dbPromise } from "./db";

const API_URL = "http://localhost:5000/api/game-results";

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
    const db = await dbPromise;

    const results = await db.getAll("gameResults");

    const unsyncedResults = results.filter((result) => result.synced === false);

    if (unsyncedResults.length === 0) {
      console.log("No data to sync");
      return;
    }

    console.log(`${unsyncedResults.length} result(s) waiting for sync`);

    for (const result of unsyncedResults) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(result),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        /*
          Server successfully saved the result.
          Now mark it as synced locally.
        */

        await db.put("gameResults", {
          ...result,
          synced: true,
        });

        console.log(`Game result ${result.id} synced successfully`);
      } catch (error) {
        console.error(`Failed to sync result ${result.id}:`, error.message);

        // Data IndexedDB mein safe rahega.
        // Next automatic sync mein dobara try hoga.
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
