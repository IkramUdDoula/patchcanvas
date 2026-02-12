/**
 * IndexedDB utility for persisting file review status
 */

const DB_NAME = 'patchcanvas-db'
const DB_VERSION = 1
const STORE_NAME = 'file-reviews'

export interface FileReviewRecord {
  id: string // composite key: `${owner}/${repo}:${commitSha}:${filename}`
  owner: string
  repo: string
  commitSha?: string
  prNumber?: number
  filename: string
  status: 'pending' | 'done'
  reviewedAt: Date
}

let dbInstance: IDBDatabase | null = null

/**
 * Initialize and open the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        
        // Create indexes for efficient querying
        store.createIndex('owner_repo', ['owner', 'repo'], { unique: false })
        store.createIndex('commitSha', 'commitSha', { unique: false })
        store.createIndex('prNumber', 'prNumber', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
    }
  })
}

/**
 * Generate composite key for file review record
 */
function generateKey(owner: string, repo: string, commitSha: string | undefined, prNumber: number | undefined, filename: string): string {
  if (commitSha) {
    return `${owner}/${repo}:commit:${commitSha}:${filename}`
  } else if (prNumber) {
    return `${owner}/${repo}:pr:${prNumber}:${filename}`
  }
  throw new Error('Either commitSha or prNumber must be provided')
}

/**
 * Set file review status
 */
export async function setFileReviewStatus(
  owner: string,
  repo: string,
  filename: string,
  status: 'pending' | 'done',
  commitSha?: string,
  prNumber?: number
): Promise<void> {
  const db = await initDB()
  const id = generateKey(owner, repo, commitSha, prNumber, filename)

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const record: FileReviewRecord = {
      id,
      owner,
      repo,
      commitSha,
      prNumber,
      filename,
      status,
      reviewedAt: new Date(),
    }

    const request = store.put(record)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get file review status
 */
export async function getFileReviewStatus(
  owner: string,
  repo: string,
  filename: string,
  commitSha?: string,
  prNumber?: number
): Promise<'pending' | 'done' | null> {
  const db = await initDB()
  const id = generateKey(owner, repo, commitSha, prNumber, filename)

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      const record = request.result as FileReviewRecord | undefined
      resolve(record?.status ?? null)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all file review statuses for a commit
 */
export async function getCommitFileReviews(
  owner: string,
  repo: string,
  commitSha: string
): Promise<FileReviewRecord[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('commitSha')
    const request = index.getAll(commitSha)

    request.onsuccess = () => {
      const records = request.result as FileReviewRecord[]
      // Filter by owner/repo to ensure we only get records for this specific repo
      const filtered = records.filter(r => r.owner === owner && r.repo === repo)
      resolve(filtered)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all file review statuses for a PR
 */
export async function getPRFileReviews(
  owner: string,
  repo: string,
  prNumber: number
): Promise<FileReviewRecord[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('prNumber')
    const request = index.getAll(prNumber)

    request.onsuccess = () => {
      const records = request.result as FileReviewRecord[]
      // Filter by owner/repo to ensure we only get records for this specific repo
      const filtered = records.filter(r => r.owner === owner && r.repo === repo)
      resolve(filtered)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all file reviews for a commit
 */
export async function clearCommitReviews(
  owner: string,
  repo: string,
  commitSha: string
): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('commitSha')
    const request = index.openCursor(IDBKeyRange.only(commitSha))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const record = cursor.value as FileReviewRecord
        if (record.owner === owner && record.repo === repo) {
          cursor.delete()
        }
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all file reviews for a PR
 */
export async function clearPRReviews(
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('prNumber')
    const request = index.openCursor(IDBKeyRange.only(prNumber))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const record = cursor.value as FileReviewRecord
        if (record.owner === owner && record.repo === repo) {
          cursor.delete()
        }
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}
