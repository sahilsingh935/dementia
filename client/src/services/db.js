import { openDB } from "idb";

const DB_NAME = "dementia-care-db";
const DB_VERSION = 1;

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Game results
    if (!db.objectStoreNames.contains("gameResults")) {
      const store = db.createObjectStore("gameResults", {
        keyPath: "id",
        autoIncrement: true,
      });

      store.createIndex("game", "game");
      store.createIndex("synced", "synced");
    }

    // Pending data waiting for internet
    if (!db.objectStoreNames.contains("syncQueue")) {
      db.createObjectStore("syncQueue", {
        keyPath: "id",
        autoIncrement: true,
      });
    }

    // Patient progress
    if (!db.objectStoreNames.contains("progress")) {
      db.createObjectStore("progress", {
        keyPath: "id",
      });
    }

    // Reminders
    if (!db.objectStoreNames.contains("reminders")) {
      db.createObjectStore("reminders", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  },
});