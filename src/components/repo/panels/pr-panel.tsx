'use client'

import { memo, useMemo } from 'react'
import { GitPullRequest, ChevronLeft, Filter, X, AlertTriangle } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useStore } from '@/store'
import { usePullRequests } from '../hooks/use-repo-data'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterBar } from '@/components/filters/filter-bar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDistanceToNow } from 'date-fns'
import { PullRequest } from '@/lib/types'

interface PRPanelProps {
  onCollapse: () => void
}

export const PRPanel = memo(function PRPanel({ onCollapse }: PRPanelProps) {
  const { owner, repo, selection, selectPR } = useRepoExplorerStore()
  const { prs, loading } = usePullRequests(owner, repo, selection?.branchName ?? null)
  const { filters, setPRFilter } = useStore()
  
  const filter = filters.pr.search
  const state = filters.pr.state

  const filteredPRs = useMemo(() => {
    return prs.filter((pr) => {
      // Safety checks for undefined properties
      if (!pr || !pr.title || !pr.number || !pr.author?.login) {
        return false
      }
      
      const matchesSearch = pr.title.toLowerCase().includes(filter.toLowerCase()) ||
        pr.number.toString().includes(filter) ||
        pr.author.login.toLowerCase().includes(filter.toLowerCase())
      if (!matchesSearch) return false
      
      // State filter: 'closed' includes both closed and merged PRs
      if (state === 'open' && pr.state !== 'open') return false
      if (state === 'closed' && pr.state === 'open') return false
      
      return true
    })
  }, [prs, filter, state])

  const handlePRClick = (pr: PullRequest) => {
    selectPR(pr.number)
  }

  const hasActiveFilters = state !== 'all'

  const renderPRItem = (pr: PullRequest) => (
    <button
      key={pr.number}
      onClick={() => handlePRClick(pr)}
      className={cn(
        'w-full text-left px-2.5 py-2 rounded-md border transition-all mb-1',
        selection?.prNumber === pr.number
          ? 'bg-primary/10 border-primary/50 shadow-sm'
          : 'border-transparent hover:bg-muted/50 hover:border-border/50'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <GitPullRequest
          className={cn(
            'h-3.5 w-3.5 flex-shrink-0',
            pr.state === 'open' && 'text-emerald-600 dark:text-emerald-400',
            pr.state === 'merged' && 'text-purple-600 dark:text-purple-400',
            pr.state === 'closed' && 'text-red-600 dark:text-red-400'
          )}
        />
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="text-xs font-semibold font-mono">#{pr.number}</span>
          {pr.hasConflicts && (
            <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400 flex-shrink-0" title="Has merge conflicts" />
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            {pr.state === 'merged' && pr.mergedAt
              ? formatDistanceToNow(new Date(pr.mergedAt), { addSuffix: true })
              : pr.state === 'closed' && pr.closedAt
              ? formatDistanceToNow(new Date(pr.closedAt), { addSuffix: true })
              : formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
          </span>
        </div>
        <img
          src={pr.author.avatar_url}
          alt={pr.author.login}
          title={pr.author.login}
          className="h-5 w-5 rounded-full flex-shrink-0"
        />
      </div>
    </button>
  )

  return (
    <div className="w-56 flex flex-col bg-card rounded-lg shadow-sm border border-border overflow-hidden h-full">
      <div className="px-3 py-2.5 border-b border-border bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-500/10 rounded">
            <GitPullRequest className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold">Pull Requests</h3>
            <span className="text-[10px] text-muted-foreground">{filteredPRs.length} of {prs.length}</span>
          </div>
        </div>
        <button onClick={onCollapse} className="p-1 hover:bg-muted rounded transition-colors" title="Hide PRs">
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <FilterBar
        searchValue={filter}
        onSearchChange={(value) => setPRFilter(value, state)}
        placeholder="Search"
        className="border-0 border-b"
        filterButton={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 w-8 p-0 flex-shrink-0", hasActiveFilters && "border-primary/50 bg-primary/5")}
                title="Filter PRs"
              >
                <Filter className={cn("h-3.5 w-3.5", hasActiveFilters && "text-primary")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Filter PRs</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={() => setPRFilter(filter, 'all')} className="h-6 px-2 text-xs">
                      <X className="h-3 w-3 mr-1" />Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">State</label>
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'All', count: prs.length },
                      { value: 'open', label: 'Open', count: prs.filter(p => p.state === 'open').length },
                      { value: 'closed', label: 'Closed', count: prs.filter(p => p.state === 'closed' || p.state === 'merged').length },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPRFilter(filter, opt.value as typeof state)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs",
                          state === opt.value ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                        )}
                      >
                        <span className="flex items-center gap-2"><GitPullRequest className="h-3 w-3" />{opt.label}</span>
                        <span className={cn("font-mono text-xs px-1.5 py-0.5 rounded", state === opt.value ? "bg-primary/20" : "bg-muted")}>{opt.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="p-2 space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-2.5 py-2 rounded-md border border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-2.5 flex-1" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !selection?.branchName ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <GitPullRequest className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Select a branch first</p>
          </div>
        ) : filteredPRs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <GitPullRequest className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{prs.length === 0 ? 'No pull requests' : 'No matches'}</p>
            {filter && (
              <button onClick={() => setPRFilter('', state)} className="text-xs text-primary hover:underline mt-1">Clear filter</button>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar p-2">
            {filteredPRs.map(pr => renderPRItem(pr))}
          </div>
        )}
      </div>
    </div>
  )
})
