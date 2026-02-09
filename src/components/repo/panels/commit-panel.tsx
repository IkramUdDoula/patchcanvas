'use client'

import { memo, useMemo, useState } from 'react'
import { GitCommit, ChevronLeft, Filter, X, User, GitPullRequest } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useCommits } from '../hooks/use-repo-data'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterBar } from '@/components/filters/filter-bar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDistanceToNow } from 'date-fns'
import { Commit } from '@/lib/types'
import { classifyCommit, getCommitRoleLabel, CommitType } from '@/lib/commit-intelligence'

interface CommitPanelProps {
  onCollapse: () => void
}

export const CommitPanel = memo(function CommitPanel({ onCollapse }: CommitPanelProps) {
  const { owner, repo, selection, selectCommit } = useRepoExplorerStore()
  const { commits, loading } = useCommits(owner, repo, selection?.prNumber ?? null, selection?.branchName ?? null)
  
  const [filter, setFilter] = useState('')
  const [author, setAuthor] = useState('all')
  const [prFilter, setPrFilter] = useState<'all' | 'in-pr' | 'not-in-pr'>('all')

  const authors = useMemo(() => 
    Array.from(new Set(commits.filter(c => c?.author?.name).map(c => c.author.name))).sort(),
    [commits]
  )

  const filteredCommits = useMemo(() => {
    return commits.filter((commit) => {
      // Safety checks for undefined properties
      if (!commit || !commit.message || !commit.sha || !commit.author?.name) {
        return false
      }
      
      const matchesSearch = commit.message.toLowerCase().includes(filter.toLowerCase()) ||
        commit.sha.toLowerCase().includes(filter.toLowerCase()) ||
        commit.author.name.toLowerCase().includes(filter.toLowerCase())
      if (!matchesSearch) return false
      if (author !== 'all' && commit.author.name !== author) return false
      
      // PR filter
      if (prFilter === 'in-pr' && !commit.associatedPR) return false
      if (prFilter === 'not-in-pr' && commit.associatedPR) return false
      
      return true
    })
  }, [commits, filter, author, prFilter])

  const handleCommitClick = (commit: Commit) => {
    selectCommit(commit.sha)
  }

  const hasActiveFilters = author !== 'all' || prFilter !== 'all'

  // Get role badge styling
  const getRoleBadgeStyle = (role: CommitType) => {
    switch (role) {
      case 'behavioral':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'refactor':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'cleanup':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
      case 'mechanical':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
      case 'test':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="w-60 flex flex-col bg-card rounded-lg shadow-sm border border-border overflow-hidden h-full">
      <div className="px-3 py-2.5 border-b border-border bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-500/10 rounded">
            <GitCommit className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold">Commits</h3>
            <span className="text-[10px] text-muted-foreground">
              {filteredCommits.length} of {commits.length}
              {selection?.prNumber ? ' in PR' : ' in branch'}
            </span>
          </div>
        </div>
        <button onClick={onCollapse} className="p-1 hover:bg-muted rounded transition-colors" title="Hide commits">
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <FilterBar
        searchValue={filter}
        onSearchChange={setFilter}
        placeholder="Search"
        className="border-0 border-b"
        filterButton={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 w-8 p-0 flex-shrink-0", hasActiveFilters && "border-primary/50 bg-primary/5")}
                title="Filter commits"
              >
                <Filter className={cn("h-3.5 w-3.5", hasActiveFilters && "text-primary")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Filter Commits</h4>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setAuthor('all')
                        setPrFilter('all')
                      }} 
                      className="h-6 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />Clear
                    </Button>
                  )}
                </div>
                
                {/* PR Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">PR Status</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setPrFilter('all')}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs", prFilter === 'all' ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
                    >
                      All commits
                    </button>
                    <button
                      onClick={() => setPrFilter('in-pr')}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs", prFilter === 'in-pr' ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
                    >
                      <GitPullRequest className="h-3 w-3" />In PR
                    </button>
                    <button
                      onClick={() => setPrFilter('not-in-pr')}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs", prFilter === 'not-in-pr' ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
                    >
                      Not in PR
                    </button>
                  </div>
                </div>
                
                {/* Author Filter */}
                {authors.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Author</label>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => setAuthor('all')}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs", author === 'all' ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
                      >
                        <User className="h-3 w-3" />All authors
                      </button>
                      {authors.map((a) => (
                        <button
                          key={a}
                          onClick={() => setAuthor(a)}
                          className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs", author === a ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}
                        >
                          <User className="h-3 w-3" />{a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {authors.length <= 1 && (
                  <p className="text-xs text-muted-foreground">No filters available</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        }
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-2 space-y-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-2.5 py-2 rounded-md border border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 flex-1" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !selection?.branchName ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <GitCommit className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Select a branch first</p>
          </div>
        ) : filteredCommits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <GitCommit className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              {commits.length === 0 ? (selection?.prNumber ? 'No commits in PR' : 'No commits') : 'No matches'}
            </p>
            {filter && (
              <button onClick={() => setFilter('')} className="text-xs text-primary hover:underline mt-1">Clear filter</button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredCommits.map((commit) => {
              const role = classifyCommit(commit.message)
              const roleLabel = getCommitRoleLabel(role)
              
              return (
                <button
                  key={commit.sha}
                  onClick={() => handleCommitClick(commit)}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-md border transition-all',
                    selection?.commitSha === commit.sha
                      ? 'bg-primary/10 border-primary/50 shadow-sm'
                      : 'border-transparent hover:bg-muted/50 hover:border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitCommit className={cn(
                      "h-3 w-3 flex-shrink-0",
                      selection?.commitSha === commit.sha ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span className="text-xs font-semibold font-mono">{commit.abbreviatedSha}</span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(commit.author.date), { addSuffix: true })}
                      </span>
                    </div>
                    {commit.author.avatar_url ? (
                      <img
                        src={commit.author.avatar_url}
                        alt={commit.author.name}
                        title={commit.author.name}
                        className="h-5 w-5 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div
                        title={commit.author.name}
                        className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                      >
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Role badge - shown below the main row */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      "text-[9px] font-medium px-1.5 py-0.5 rounded",
                      getRoleBadgeStyle(role)
                    )}>
                      {roleLabel}
                    </span>
                    
                    {/* PR chip - only show for open or merged PRs */}
                    {commit.associatedPR && (commit.associatedPR.state === 'open' || commit.associatedPR.state === 'merged') && (
                      <span className={cn(
                        "text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1",
                        commit.associatedPR.state === 'open' 
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30"
                      )}>
                        <GitPullRequest className="h-2.5 w-2.5" />
                        <span>#{commit.associatedPR.number}</span>
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})
