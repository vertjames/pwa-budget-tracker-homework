if ("serviceWorker" in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log(reg))
  })
}

let db
const request = indexedDB.open("budget", 1)

request.onupgradeneeded = e => {
  const db = e.target.result
  db.createObjectStore("pending", { autoIncrement: true })
}

request.onsuccess = e => {
  db = e.target.result
  if (navigator.onLine) {
    checkDatabase()
  }
}

request.onerror = e => {
  console.log(`Something went wrong... ${e.target.errorCode}`)
}

function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite")
  const store = transaction.objectStore("pending")
  store.add(record)
}

function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite")
  const store = transaction.objectStore("pending")
  const getAll = store.getAll()

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite")
          const store = transaction.objectStore("pending")
          store.clear()
        })
    }
  }
}

window.addEventListener("online", checkDatabase)
