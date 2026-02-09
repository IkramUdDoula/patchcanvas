'use client'

import { memo, useMemo, useState } from 'react'
import { GitBranch, ChevronLeft } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
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
  
  const [filter, setFilter] = useState('')

  const filteredBranches = useMemo(() => {
    return branches
      .filter((branch) => {
        if (!branch.name.toLowerCase().includes(filter.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        // Always keep default branch on top
        if (a.isDefault) return -1
        if (b.isDefault) return 1
        
        // Then branches with PRs (sorted by PR count descending)
        const aPRCount = a.prCount || 0
        const bPRCount = b.prCount || 0
        
        if (aPRCount > 0 && bPRCount === 0) return -1
        if (aPRCount === 0 && bPRCount > 0) return 1
        if (aPRCount > 0 && bPRCount > 0) {
          return bPRCount - aPRCount
        }
        
        // Finally sort rest by date descending
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
        onSearchChange={setFilter}
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
              <button onClick={() => setFilter('')} className="text-xs text-primary hover:underline mt-1">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredBranches.map((branch) => {
              const hasPRs = (branch.prCount || 0) > 0
              return (
                <button
                  key={branch.name}
                  onClick={() => handleBranchClick(branch.name)}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-md border transition-all',
                    selection?.branchName === branch.name
                      ? 'bg-primary/10 border-primary/50 shadow-sm'
                      : hasPRs
                      ? 'border-purple-200/50 bg-purple-50/30 hover:bg-purple-50/50 dark:border-purple-500/20 dark:bg-purple-500/5 dark:hover:bg-purple-500/10'
                      : 'border-transparent hover:bg-muted/50 hover:border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className={cn(
                      "h-3 w-3 flex-shrink-0",
                      selection?.branchName === branch.name 
                        ? "text-primary" 
                        : hasPRs 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-xs font-medium truncate flex-1",
                      hasPRs && "text-purple-900 dark:text-purple-100"
                    )}>
                      {branch.name}
                    </span>
                    {branch.isDefault && (
                      <Badge variant="secondary" className="h-4 text-[9px] px-1.5 flex-shrink-0">default</Badge>
                    )}
                    {hasPRs && (
                      <Badge 
                        variant="secondary" 
                        className="h-4 text-[9px] px-1.5 flex-shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30"
                      >
                        {branch.prCount}
                      </Badge>
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
