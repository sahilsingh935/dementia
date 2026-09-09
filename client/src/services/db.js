import { openDB } from "idb";

const DB_NAME = "dementia-care-db";
const DB_VERSION = 3;

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    // =========================
    // GAME RESULTS
    // =========================

    if (!db.objectStoreNames.contains("gameResults")) {
      const store = db.createObjectStore("gameResults", {
        keyPath: "id",
        autoIncrement: true,
      });

      store.createIndex("game", "game");
      store.createIndex("synced", "synced");
      store.createIndex("patientId", "patientId");
      store.createIndex("patientKey", "patientKey");
    } else {
      const store = transaction.objectStore("gameResults");

      if (!store.indexNames.contains("game")) {
        store.createIndex("game", "game");
      }

      if (!store.indexNames.contains("synced")) {
        store.createIndex("synced", "synced");
      }

      if (!store.indexNames.contains("patientId")) {
        store.createIndex("patientId", "patientId");
      }

      if (!store.indexNames.contains("patientKey")) {
        store.createIndex("patientKey", "patientKey");
      }
    }

    // =========================
    // SYNC QUEUE
    // =========================

    if (!db.objectStoreNames.contains("syncQueue")) {
      db.createObjectStore("syncQueue", {
        keyPath: "id",
        autoIncrement: true,
      });
    }

    // =========================
    // PATIENT PROGRESS
    // =========================

    if (!db.objectStoreNames.contains("progress")) {
      const progressStore = db.createObjectStore("progress", {
        keyPath: "id",
      });

      progressStore.createIndex("patientId", "patientId");
      progressStore.createIndex("patientKey", "patientKey");
    } else {
      const progressStore = transaction.objectStore("progress");

      if (!progressStore.indexNames.contains("patientId")) {
        progressStore.createIndex("patientId", "patientId");
      }

      if (!progressStore.indexNames.contains("patientKey")) {
        progressStore.createIndex("patientKey", "patientKey");
      }
    }

    // =========================
    // REMINDERS
    // =========================

    if (!db.objectStoreNames.contains("reminders")) {
      const reminderStore = db.createObjectStore("reminders", {
        keyPath: "id",
        autoIncrement: true,
      });

      reminderStore.createIndex("patientId", "patientId");
      reminderStore.createIndex("patientKey", "patientKey");
    } else {
      const reminderStore = transaction.objectStore("reminders");

      if (!reminderStore.indexNames.contains("patientId")) {
        reminderStore.createIndex("patientId", "patientId");
      }

      if (!reminderStore.indexNames.contains("patientKey")) {
        reminderStore.createIndex("patientKey", "patientKey");
      }
    }
  },
});
