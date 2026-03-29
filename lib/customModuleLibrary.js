const DB_NAME = "pnt-custom-modules";
const DB_VERSION = 1;
const STORE_NAME = "custom-modules";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
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

export async function listCustomModules() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const result = await wrapRequest(store.getAll());
  db.close();
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveCustomModule(name) {
  const entry = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: new Date().toISOString()
  };
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await wrapRequest(store.put(entry));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Could not save custom module"));
    tx.onabort = () => reject(tx.error || new Error("Save aborted"));
  });
  db.close();
  return entry;
}

export async function renameCustomModule(id, newName) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const entry = await wrapRequest(store.get(id));
  if (!entry) {
    db.close();
    return;
  }
  await wrapRequest(store.put({ ...entry, name: newName }));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Could not rename custom module"));
    tx.onabort = () => reject(tx.error || new Error("Rename aborted"));
  });
  db.close();
}

export async function deleteCustomModule(id) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await wrapRequest(store.delete(id));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Could not delete custom module"));
    tx.onabort = () => reject(tx.error || new Error("Delete aborted"));
  });
  db.close();
}
