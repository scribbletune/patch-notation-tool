const DB_NAME = "patch-notation-tool";
const DB_VERSION = 1;
const STORE_NAME = "patches";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });
        store.createIndex("updatedAt", "updatedAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open IndexedDB"));
  });
}

function wrapRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

export async function listStoredPatches() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const result = await wrapRequest(store.getAll());
  database.close();

  return result
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    }));
}

export async function getStoredPatch(id) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const result = await wrapRequest(store.get(id));
  database.close();
  return result || null;
}

export async function saveStoredPatch(patch) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await wrapRequest(store.put(patch));
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () =>
      reject(transaction.error || new Error("Could not save patch"));
    transaction.onabort = () =>
      reject(transaction.error || new Error("Patch save was aborted"));
  });
  database.close();
  return patch;
}

export async function deleteStoredPatch(id) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await wrapRequest(store.delete(id));
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () =>
      reject(transaction.error || new Error("Could not delete patch"));
    transaction.onabort = () =>
      reject(transaction.error || new Error("Patch delete was aborted"));
  });
  database.close();
}
