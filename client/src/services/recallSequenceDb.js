const DB_NAME = "SmritiSetuRecallSequenceDB";
const STORE_NAME = "recallSequenceResults";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
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

// SAVE RESULT
export async function saveRecallSequenceResult(data) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.add({
      ...data,
      synced: false,
      createdAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// GET UNSYNCED RESULTS
export async function getUnsyncedRecallSequenceResults() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const unsynced = request.result.filter((item) => item.synced === false);

      resolve(unsynced);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// MARK RESULT AS SYNCED
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
