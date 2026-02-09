'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useStore } from '@/store'

/**
 * Monitors authentication state and clears filters on sign-out
 */
export function AuthMonitor() {
  const { userId } = useAuth()
  const clearFilters = useStore((state) => state.clearFilters)

  useEffect(() => {
    // If user signs out (userId becomes null), clear filters
    if (!userId) {
      clearFilters()
    }
  }, [userId, clearFilters])

  return null
}
