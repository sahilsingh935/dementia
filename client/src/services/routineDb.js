const DB_NAME = "SmritiSetuDB";
const STORE_NAME = "routineResults";
const DB_VERSION = 3;

// ======================================
// GET CURRENT PATIENT
// ======================================

function getCurrentPatientId() {
  return (
    localStorage.getItem("manasUserId") ||
    sessionStorage.getItem("manasUserId") ||
    null
  );
}

// ======================================
// OPEN DATABASE
// ======================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const transaction = event.target.transaction;

      // ======================================
      // CREATE STORE
      // ======================================

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("synced", "synced", {
          unique: false,
        });

        store.createIndex("playedAt", "playedAt", {
          unique: false,
        });

        store.createIndex("patientKey", "patientKey", {
          unique: false,
        });
      }

      // ======================================
      // EXISTING STORE UPGRADE
      // ======================================
      else {
        const store = transaction.objectStore(STORE_NAME);

        if (!store.indexNames.contains("synced")) {
          store.createIndex("synced", "synced", {
            unique: false,
          });
        }

        if (!store.indexNames.contains("playedAt")) {
          store.createIndex("playedAt", "playedAt", {
            unique: false,
          });
        }

        if (!store.indexNames.contains("patientKey")) {
          store.createIndex("patientKey", "patientKey", {
            unique: false,
          });
        }
      }
    };
  });
}

// ======================================
// SAVE ROUTINE GAME RESULT
// ======================================

export async function saveRoutineResult(result) {
  const patientKey = getCurrentPatientId();

  if (!patientKey) {
    console.error("No logged-in patient found. Routine result not saved.");

    throw new Error("Patient authentication required.");
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    const data = {
      ...result,

      // ======================================
      // PATIENT IDENTIFICATION
      // ======================================

      patientKey,

      // ======================================
      // GAME INFORMATION
      // ======================================

      gameType: "routine",

      // ======================================
      // SYNC
      // ======================================

      synced: false,

      playedAt: result.playedAt || new Date().toISOString(),
    };

    const request = store.add(data);

    request.onsuccess = () => {
      console.log("Routine result saved locally:", {
        id: request.result,
        patientKey,
      });

      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ======================================
// GET UNSYNCED ROUTINE RESULTS
// ======================================

export async function getUnsyncedRoutineResults() {
  const patientKey = getCurrentPatientId();

  if (!patientKey) {
    console.log("No logged-in patient - Routine sync skipped.");

    return [];
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];

      /*
          Sirf current patient ke
          unsynced results return honge.
        */

      const patientResults = results.filter(
        (item) => item.synced === false && item.patientKey === patientKey,
      );

      resolve(patientResults);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ======================================
// MARK ROUTINE RESULT AS SYNCED
// ======================================

export async function markRoutineResultSynced(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => {
      const data = request.result;

      if (!data) {
        resolve();
        return;
      }

      data.synced = true;

      const updateRequest = store.put(data);

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(updateRequest.error);
      };
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ======================================
// GET ALL ROUTINE RESULTS
// ======================================

export async function getAllRoutineResults() {
  const patientKey = getCurrentPatientId();

  if (!patientKey) {
    return [];
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];

      /*
          Patient ko sirf apne
          Routine results milenge.
        */

      resolve(results.filter((item) => item.patientKey === patientKey));
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
