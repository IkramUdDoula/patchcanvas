import { useState, useEffect, useCallback } from 'react'
import { getFileReviewStatus, setFileReviewStatus } from '@/lib/db'

/**
 * Hook to manage file review status with IndexedDB
 */
export function useFileReviewStatus(
  owner: string,
  repo: string,
  filename: string,
  commitSha?: string,
  prNumber?: number
) {
  const [status, setStatus] = useState<'pending' | 'done' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load status from IndexedDB
  useEffect(() => {
    const loadStatus = async () => {
      if (!owner || !repo || !filename) {
        setIsLoading(false)
        return
      }

      try {
        const reviewStatus = await getFileReviewStatus(
          owner,
          repo,
          filename,
          commitSha,
          prNumber
        )
        setStatus(reviewStatus)
      } catch (error) {
        console.error('Failed to load file review status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStatus()
  }, [owner, repo, filename, commitSha, prNumber])

  // Update status in IndexedDB
  const updateStatus = useCallback(
    async (newStatus: 'pending' | 'done') => {
      if (!owner || !repo || !filename) return

      try {
        await setFileReviewStatus(
          owner,
          repo,
          filename,
          newStatus,
          commitSha,
          prNumber
        )
        setStatus(newStatus)
      } catch (error) {
        console.error('Failed to update file review status:', error)
        throw error
      }
    },
    [owner, repo, filename, commitSha, prNumber]
  )

  // Toggle between pending and done
  const toggleStatus = useCallback(async () => {
    const newStatus = status === 'done' ? 'pending' : 'done'
    await updateStatus(newStatus)
  }, [status, updateStatus])

  return {
    status,
    isLoading,
    updateStatus,
    toggleStatus,
  }
}
