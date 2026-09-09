const DB_NAME = "SmritiSetuRecallSequenceDB";
const STORE_NAME = "recallSequenceResults";
const DB_VERSION = 2;

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

        store.createIndex("createdAt", "createdAt", {
          unique: false,
        });

        store.createIndex("patientKey", "patientKey", {
          unique: false,
        });
      }

      // ======================================
      // UPGRADE EXISTING STORE
      // ======================================
      else {
        const store = transaction.objectStore(STORE_NAME);

        if (!store.indexNames.contains("synced")) {
          store.createIndex("synced", "synced", {
            unique: false,
          });
        }

        if (!store.indexNames.contains("createdAt")) {
          store.createIndex("createdAt", "createdAt", {
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

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ======================================
// SAVE RESULT
// ======================================

export async function saveRecallSequenceResult(data) {
  const patientKey = getCurrentPatientId();

  if (!patientKey) {
    console.error(
      "No logged-in patient found. Recall Sequence result not saved.",
    );

    throw new Error("Patient authentication required.");
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.add({
      ...data,

      // ======================================
      // PATIENT IDENTIFICATION
      // ======================================

      patientKey,

      // ======================================
      // SYNC
      // ======================================

      synced: false,

      // ======================================
      // TIMESTAMP
      // ======================================

      createdAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      console.log("Recall Sequence result saved locally:", {
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
// GET UNSYNCED RESULTS
// ======================================

export async function getUnsyncedRecallSequenceResults() {
  const patientKey = getCurrentPatientId();

  if (!patientKey) {
    console.log("No logged-in patient - Recall Sequence sync skipped.");

    return [];
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];

      const unsynced = results.filter(
        (item) => item.synced === false && item.patientKey === patientKey,
      );

      resolve(unsynced);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ======================================
// MARK RESULT AS SYNCED
// ======================================

export async function markRecallSequenceSynced(id) {
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
