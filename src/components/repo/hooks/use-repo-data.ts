import { useQuery } from '@tanstack/react-query'
import { Branch, PullRequest, Commit, CommitFile, PRDetails, PRReview, CheckRun, TimelineEvent, PRFile } from '@/lib/types'
import { cacheGet, cacheSet } from '@/lib/indexdb'

// Branch data hook - USES GRAPHQL + IndexedDB
export function useBranches(owner: string | null, repo: string | null) {
  const { data: branches = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['branches-graphql', owner, repo],
    queryFn: async () => {
      if (!owner || !repo) return []
      
      const cacheKey = `${owner}/${repo}`
      
      // Try IndexedDB first
      const cached = await cacheGet<Branch[]>('branches', cacheKey)
      if (cached) {
        console.log('[Cache Hit] Branches from IndexedDB')
        return cached
      }
      
      // Fetch from API
      const response = await window.fetch(`/api/repos?action=branches&owner=${owner}&repo=${repo}`)
      if (!response.ok) throw new Error('Failed to fetch branches')
      const data = await response.json() as Branch[]
      
      // Cache in IndexedDB
      await cacheSet('branches', cacheKey, data, 5 * 60 * 1000) // 5 min TTL
      
      return data
    },
    enabled: !!owner && !!repo,
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  return { 
    branches, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// PR data hook - USES GRAPHQL with all stats in one call + IndexedDB
export function usePullRequests(owner: string | null, repo: string | null, targetBranch: string | null) {
  const { data: prs = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['pulls-graphql', owner, repo, targetBranch],
    queryFn: async () => {
      if (!owner || !repo || !targetBranch) return []
      
      const cacheKey = `${owner}/${repo}/${targetBranch}`
      
      // Try IndexedDB first
      const cached = await cacheGet<PullRequest[]>('pulls', cacheKey)
      if (cached) {
        console.log('[Cache Hit] PRs from IndexedDB')
        return cached
      }
      
      // Fetch from API
      const response = await window.fetch(
        `/api/repos?action=pulls&owner=${owner}&repo=${repo}&targetBranch=${targetBranch}`
      )
      if (!response.ok) throw new Error('Failed to fetch PRs')
      const data = await response.json() as PullRequest[]
      
      // Cache in IndexedDB
      await cacheSet('pulls', cacheKey, data, 2 * 60 * 1000) // 2 min TTL
      
      return data
    },
    enabled: !!owner && !!repo && !!targetBranch,
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  return { 
    prs, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// Commits data hook (supports both PR commits and branch commits) + IndexedDB
export function useCommits(
  owner: string | null,
  repo: string | null,
  prNumber: number | null,
  branch: string | null
) {
  const { data: commits = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['commits', owner, repo, prNumber, branch],
    queryFn: async () => {
      if (!owner || !repo) return []
      
      const cacheKey = prNumber 
        ? `${owner}/${repo}/pr/${prNumber}`
        : `${owner}/${repo}/branch/${branch}`
      
      // Try IndexedDB first
      const cached = await cacheGet<Commit[]>('commits', cacheKey)
      if (cached) {
        console.log('[Cache Hit] Commits from IndexedDB')
        return cached
      }
      
      let data: Commit[]
      
      if (prNumber) {
        const response = await window.fetch(
          `/api/repos?action=pr-commits&owner=${owner}&repo=${repo}&number=${prNumber}`
        )
        if (!response.ok) throw new Error('Failed to fetch PR commits')
        data = await response.json()
      } else if (branch) {
        const response = await window.fetch(
          `/api/repos?action=commits&owner=${owner}&repo=${repo}&branch=${encodeURIComponent(branch)}`
        )
        if (!response.ok) throw new Error('Failed to fetch branch commits')
        const result = await response.json()
        data = result.commits || result
      } else {
        return []
      }
      
      // Cache in IndexedDB
      await cacheSet('commits', cacheKey, data, 3 * 60 * 1000) // 3 min TTL
      
      return data
    },
    enabled: !!owner && !!repo && (!!prNumber || !!branch),
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  return { 
    commits, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// Files data hook + IndexedDB
export function useCommitFiles(owner: string | null, repo: string | null, commitSha: string | null) {
  const { data: files = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['commit-files', owner, repo, commitSha],
    queryFn: async () => {
      if (!owner || !repo || !commitSha) return []
      
      const cacheKey = `${owner}/${repo}/${commitSha}`
      
      // Try IndexedDB first
      const cached = await cacheGet<CommitFile[]>('files', cacheKey)
      if (cached) {
        console.log('[Cache Hit] Files from IndexedDB')
        return cached
      }
      
      // Fetch from API
      const response = await window.fetch(
        `/api/repos?action=commit&owner=${owner}&repo=${repo}&sha=${commitSha}`
      )
      if (!response.ok) throw new Error('Failed to fetch files')
      const result = await response.json()
      const data = result.files as CommitFile[]
      
      // Cache in IndexedDB
      await cacheSet('files', cacheKey, data, 5 * 60 * 1000) // 5 min TTL
      
      return data
    },
    enabled: !!owner && !!repo && !!commitSha,
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  return { 
    files, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// PR Details hook
export function usePRDetails(owner: string | null, repo: string | null, prNumber: number | null) {
  const { data: prDetails = null, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['pr-details', owner, repo, prNumber],
    queryFn: async () => {
      if (!owner || !repo || !prNumber) return null
      const response = await window.fetch(
        `/api/repos?action=pr&owner=${owner}&repo=${repo}&number=${prNumber}`
      )
      if (!response.ok) throw new Error('Failed to fetch PR details')
      return response.json() as Promise<PRDetails>
    },
    enabled: !!owner && !!repo && !!prNumber,
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  return { 
    prDetails, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// PR Timeline hook
export function usePRTimeline(owner: string | null, repo: string | null, prNumber: number | null) {
  const { data: timeline = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['pr-timeline', owner, repo, prNumber],
    queryFn: async () => {
      if (!owner || !repo || !prNumber) return []
      const response = await window.fetch(
        `/api/pulls/${prNumber}/timeline?owner=${owner}&repo=${repo}`
      )
      if (!response.ok) throw new Error('Failed to fetch PR timeline')
      return response.json() as Promise<TimelineEvent[]>
    },
    enabled: !!owner && !!repo && !!prNumber,
  })

  return { 
    timeline, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// PR Reviews hook
export function usePRReviews(owner: string | null, repo: string | null, prNumber: number | null) {
  const { data: reviews = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['pr-reviews', owner, repo, prNumber],
    queryFn: async () => {
      if (!owner || !repo || !prNumber) return []
      const response = await window.fetch(
        `/api/pulls/${prNumber}/reviews?owner=${owner}&repo=${repo}`
      )
      if (!response.ok) throw new Error('Failed to fetch PR reviews')
      return response.json() as Promise<PRReview[]>
    },
    enabled: !!owner && !!repo && !!prNumber,
  })

  return { 
    reviews, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// PR Checks hook
export function usePRChecks(owner: string | null, repo: string | null, prNumber: number | null) {
  const { data: checks = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['pr-checks', owner, repo, prNumber],
    queryFn: async () => {
      if (!owner || !repo || !prNumber) return []
      const response = await window.fetch(
        `/api/pulls/${prNumber}/checks?owner=${owner}&repo=${repo}`
      )
      if (!response.ok) throw new Error('Failed to fetch PR checks')
      return response.json() as Promise<CheckRun[]>
    },
    enabled: !!owner && !!repo && !!prNumber,
  })

  return { 
    checks, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}

// PR Files hook
export function usePRFiles(owner: string | null, repo: string | null, prNumber: number | null) {
  const { data: files = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['pr-files', owner, repo, prNumber],
    queryFn: async () => {
      if (!owner || !repo || !prNumber) return []
      const response = await window.fetch(
        `/api/repos?action=pr-files&owner=${owner}&repo=${repo}&number=${prNumber}`
      )
      if (!response.ok) throw new Error('Failed to fetch PR files')
      return response.json() as Promise<PRFile[]>
    },
    enabled: !!owner && !!repo && !!prNumber,
  })

  return { 
    files, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  }
}
