const DATABASE_NAME = "folio-review-studio";
const DATABASE_VERSION = 1;
const STORE_NAME = "reviews";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the review database."));
    request.onblocked = () => reject(new Error("The review database is blocked by another open connection."));
  });
}

async function runStoreRequest(mode, operation) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    let result;

    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error || new Error("The database request failed."));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error("The database transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("The database transaction was aborted."));
  });
}

export function addReview(review) {
  return runStoreRequest("readwrite", (store) => store.put(review));
}

export async function getAllReviews() {
  const reviews = await runStoreRequest("readonly", (store) => store.getAll());
  return reviews.sort((first, second) => new Date(second.analyzedAt) - new Date(first.analyzedAt));
}

export function deleteReview(id) {
  return runStoreRequest("readwrite", (store) => store.delete(id));
}

export function deleteAllReviews() {
  return runStoreRequest("readwrite", (store) => store.clear());
}