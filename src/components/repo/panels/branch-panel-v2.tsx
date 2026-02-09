'use client'

import { memo, useMemo, useEffect } from 'react'
import { GitBranch, ChevronLeft } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useStore } from '@/store'
import { useBranches } from '../hooks/use-repo-data'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterBar } from '@/components/filters/filter-bar'
import { Badge } from '@/components/ui/badge'

interface BranchPanelProps {
  onCollapse: () => void
}

export const BranchPanel = memo(function BranchPanel({ onCollapse }: BranchPanelProps) {
  const { owner, repo, selection, selectBranch } = useRepoExplorerStore()
  const { branches, loading, error } = useBranches(owner, repo)
  const { filters, setBranchFilter } = useStore()
  
  const filter = filters.branch.search

  const filteredBranches = useMemo(() => {
    return branches
      .filter((branch) => {
        if (!branch.name.toLowerCase().includes(filter.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        if (a.isDefault) return -1
        if (b.isDefault) return 1
        const aPRCount = a.prCount || 0
        const bPRCount = b.prCount || 0
        if (aPRCount > 0 && bPRCount === 0) return -1
        if (aPRCount === 0 && bPRCount > 0) return 1
        if (aPRCount > 0 && bPRCount > 0) return bPRCount - aPRCount
        return new Date(b.commit.date).getTime() - new Date(a.commit.date).getTime()
      })
  }, [branches, filter])

  const handleBranchClick = (branchName: string) => {
    selectBranch(branchName)
  }

  return (
    <div className="w-48 flex flex-col bg-card rounded-lg shadow-sm border border-border overflow-hidden h-full">
      <div className="px-3 py-2.5 border-b border-border bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <GitBranch className="h-3 w-3 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold">Branches</h3>
            <span className="text-[10px] text-muted-foreground">{filteredBranches.length} total</span>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Hide branches"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <FilterBar
        searchValue={filter}
        onSearchChange={setBranchFilter}
        placeholder="Search"
        className="border-0 border-b"
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-2 space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-2.5 py-2 rounded-md border border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-destructive text-xs">{error}</div>
        ) : filteredBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <GitBranch className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No branches found</p>
            {filter && (
              <button onClick={() => setBranchFilter('')} className="text-xs text-primary hover:underline mt-1">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredBranches.map((branch) => {
              const hasPRs = (branch.prCount || 0) > 0
              const isSelected = selection?.branchName === branch.name
              return (
                <button
                  key={branch.name}
                  onClick={() => handleBranchClick(branch.name)}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-md border transition-all group',
                    isSelected && hasPRs && [
                      'bg-purple-100 border-purple-400 shadow-sm ring-1 ring-purple-300',
                      'dark:bg-purple-500/20 dark:border-purple-500/60 dark:ring-purple-500/40'
                    ],
                    isSelected && !hasPRs && [
                      'bg-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/20',
                      'dark:bg-primary/10 dark:border-primary/50 dark:ring-primary/30'
                    ],
                    !isSelected && hasPRs && [
                      'border-purple-300/70 bg-purple-100/40',
                      'hover:bg-purple-100/60 hover:border-purple-400/80 hover:shadow-sm',
                      'dark:border-purple-500/30 dark:bg-purple-500/8',
                      'dark:hover:bg-purple-500/15 dark:hover:border-purple-500/40'
                    ],
                    !isSelected && !hasPRs && [
                      'border-border/30 bg-transparent',
                      'hover:bg-muted/60 hover:border-border/60',
                      'dark:border-border/20 dark:hover:bg-muted/40 dark:hover:border-border/40'
                    ]
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className={cn(
                      "h-3 w-3 flex-shrink-0 transition-colors",
                      hasPRs && "text-purple-600 dark:text-purple-400",
                      !hasPRs && isSelected && "text-primary",
                      !hasPRs && !isSelected && "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className={cn(
                      "text-xs truncate flex-1 transition-colors",
                      isSelected && "font-semibold text-foreground",
                      !isSelected && hasPRs && "font-semibold text-foreground/90 group-hover:text-foreground",
                      !isSelected && !hasPRs && "font-medium text-foreground/80 group-hover:text-foreground"
                    )}>
                      {hasPRs ? `${branch.name}` : branch.name}
                    </span>
                    {branch.isDefault && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "h-4 text-[9px] px-1.5 flex-shrink-0 font-medium",
                          isSelected && "bg-primary/15 text-primary border-primary/30",
                          !isSelected && "bg-muted text-muted-foreground border-border/50"
                        )}
                      >
                        default
                      </Badge>
                    )}
                    {hasPRs && (
                      <span 
                        className="pr-count-badge inline-flex items-center h-4 text-[9px] px-1.5 flex-shrink-0 font-bold rounded-md border transition-colors bg-purple-100 border-purple-300 group-hover:bg-purple-200 dark:bg-purple-500/30 dark:border-purple-500/50 dark:group-hover:bg-purple-500/40"
                      >
                        {branch.prCount}
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
