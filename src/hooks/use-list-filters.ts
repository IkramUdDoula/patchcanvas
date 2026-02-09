import { useMemo, useState } from 'react'
import { Branch, PullRequest, Commit, CommitFile } from '@/lib/types'
import { DateRange } from '@/components/filters/date-range-filter'

// Branch Filters
export interface BranchFilters {
  search: string
  status: 'all' | 'active' | 'deleted'
}

export function useBranchFilters(branches: Branch[]) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BranchFilters['status']>('all')

  const filtered = useMemo(() => {
    return branches.filter((branch) => {
      // Search filter
      if (search && !branch.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      // Status filter (for now, all branches are active)
      // This can be extended when deleted branches are tracked
      if (status === 'deleted') {
        return false
      }

      return true
    })
  }, [branches, search, status])

  return {
    filtered,
    search,
    setSearch,
    status,
    setStatus,
  }
}

// Pull Request Filters
export interface PRFilters {
  search: string
  state: 'all' | 'open' | 'closed' | 'merged'
  author: string
  dateRange: DateRange
}

export function usePRFilters(prs: PullRequest[]) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState<PRFilters['state']>('all')
  const [author, setAuthor] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })

  const authors = useMemo(() => {
    const uniqueAuthors = new Set(prs.map((pr) => pr.author.login))
    return Array.from(uniqueAuthors).sort()
  }, [prs])

  const filtered = useMemo(() => {
    return prs.filter((pr) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !pr.title.toLowerCase().includes(searchLower) &&
          !pr.number.toString().includes(searchLower) &&
          !pr.sourceBranch.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      // State filter
      if (state !== 'all' && pr.state !== state) {
        return false
      }

      // Author filter
      if (author !== 'all' && pr.author.login !== author) {
        return false
      }

      // Date range filter (would need created_at date in PR type)
      // Placeholder for when date is added to PullRequest type

      return true
    })
  }, [prs, search, state, author, dateRange])

  return {
    filtered,
    search,
    setSearch,
    state,
    setState,
    author,
    setAuthor,
    authors,
    dateRange,
    setDateRange,
  }
}

// Commit Filters
export interface CommitFilters {
  search: string
  author: string
  dateRange: DateRange
}

export function useCommitFilters(commits: Commit[]) {
  const [search, setSearch] = useState('')
  const [author, setAuthor] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })

  const authors = useMemo(() => {
    const uniqueAuthors = new Set(commits.map((c) => c.author.name))
    return Array.from(uniqueAuthors).sort()
  }, [commits])

  const filtered = useMemo(() => {
    return commits.filter((commit) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !commit.message.toLowerCase().includes(searchLower) &&
          !commit.sha.toLowerCase().includes(searchLower) &&
          !commit.abbreviatedSha.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      // Author filter
      if (author !== 'all' && commit.author.name !== author) {
        return false
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const commitDate = new Date(commit.author.date)
        if (dateRange.from && commitDate < dateRange.from) {
          return false
        }
        if (dateRange.to && commitDate > dateRange.to) {
          return false
        }
      }

      return true
    })
  }, [commits, search, author, dateRange])

  return {
    filtered,
    search,
    setSearch,
    author,
    setAuthor,
    authors,
    dateRange,
    setDateRange,
  }
}

// File Filters
export interface FileFilters {
  search: string
  status: 'all' | 'added' | 'modified' | 'deleted' | 'renamed'
}

export function useFileFilters(files: CommitFile[]) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FileFilters['status']>('all')

  const statusCounts = useMemo(() => {
    return {
      all: files.length,
      added: files.filter((f) => f.status === 'added').length,
      modified: files.filter((f) => f.status === 'modified').length,
      deleted: files.filter((f) => f.status === 'deleted').length,
      renamed: files.filter((f) => f.status === 'renamed').length,
    }
  }, [files])

  const filtered = useMemo(() => {
    return files.filter((file) => {
      // Search filter
      if (search && !file.filename.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      // Status filter
      if (status !== 'all' && file.status !== status) {
        return false
      }

      return true
    })
  }, [files, search, status])

  return {
    filtered,
    search,
    setSearch,
    status,
    setStatus,
    statusCounts,
  }
}

// Diff Content Search
export function useDiffSearch() {
  const [search, setSearch] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)

  const highlightMatches = (content: string) => {
    if (!search) return content

    const regex = new RegExp(`(${search})`, 'gi')
    return content.replace(regex, '<mark>$1</mark>')
  }

  const navigateToMatch = (direction: 'next' | 'prev') => {
    if (totalMatches === 0) return

    if (direction === 'next') {
      setCurrentMatch((prev) => (prev + 1) % totalMatches)
    } else {
      setCurrentMatch((prev) => (prev - 1 + totalMatches) % totalMatches)
    }
  }

  return {
    search,
    setSearch,
    currentMatch,
    totalMatches,
    setTotalMatches,
    highlightMatches,
    navigateToMatch,
  }
}
