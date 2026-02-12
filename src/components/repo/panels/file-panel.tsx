'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import { FileCode, ChevronLeft, Filter, X, CheckCircle2 } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useCommitFiles } from '../hooks/use-repo-data'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterBar } from '@/components/filters/filter-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CommitFile } from '@/lib/types'
import { getCommitFileReviews, getPRFileReviews, FileReviewRecord } from '@/lib/db'

interface FilePanelProps {
  onCollapse: () => void
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'added':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    case 'modified':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    case 'deleted':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    case 'renamed':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
  }
}

export const FilePanel = memo(function FilePanel({ onCollapse }: FilePanelProps) {
  const { owner, repo, selection, selectFile } = useRepoExplorerStore()
  const { files, loading, error } = useCommitFiles(owner, repo, selection?.commitSha ?? '')
  
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState<'all' | 'added' | 'modified' | 'deleted' | 'renamed'>('all')
  const [fileReviews, setFileReviews] = useState<Map<string, 'pending' | 'done'>>(new Map())

  // Load file review statuses from IndexedDB
  useEffect(() => {
    const loadReviews = async () => {
      if (!owner || !repo) return
      
      try {
        let reviews: FileReviewRecord[] = []
        
        if (selection?.commitSha) {
          reviews = await getCommitFileReviews(owner, repo, selection.commitSha)
        } else if (selection?.prNumber) {
          reviews = await getPRFileReviews(owner, repo, selection.prNumber)
        }
        
        const reviewMap = new Map<string, 'pending' | 'done'>()
        reviews.forEach(review => {
          reviewMap.set(review.filename, review.status)
        })
        setFileReviews(reviewMap)
      } catch (error) {
        console.error('Failed to load file reviews:', error)
      }
    }
    
    loadReviews()
    
    // Set up an interval to refresh reviews (in case they're updated in another tab/component)
    const interval = setInterval(loadReviews, 2000)
    return () => clearInterval(interval)
  }, [owner, repo, selection?.commitSha, selection?.prNumber])

  const statusCounts = useMemo(() => ({
    all: files.length,
    added: files.filter(f => f.status === 'added').length,
    modified: files.filter(f => f.status === 'modified').length,
    deleted: files.filter(f => f.status === 'deleted').length,
    renamed: files.filter(f => f.status === 'renamed').length,
  }), [files])

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (!file.filename.toLowerCase().includes(filter.toLowerCase())) return false
      if (status !== 'all' && file.status !== status) return false
      return true
    })
  }, [files, filter, status])

  const handleFileClick = (file: CommitFile) => {
    selectFile(file.filename)
  }

  const hasActiveFilters = status !== 'all'

  return (
    <div className="w-72 flex flex-col bg-card rounded-lg shadow-sm border border-border overflow-hidden h-full">
      <div className="px-3 py-2.5 border-b border-border bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/10 rounded">
            <FileCode className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold">Changed Files</h3>
            <span className="text-[10px] text-muted-foreground">{filteredFiles.length} of {files.length}</span>
          </div>
        </div>
        <button onClick={onCollapse} className="p-1 hover:bg-muted rounded transition-colors" title="Hide files">
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
                title="Filter files"
              >
                <Filter className={cn("h-3.5 w-3.5", hasActiveFilters && "text-primary")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Filter Files</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={() => setStatus('all')} className="h-6 px-2 text-xs">
                      <X className="h-3 w-3 mr-1" />Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'All files', count: statusCounts.all },
                    { value: 'added', label: 'Added', count: statusCounts.added },
                    { value: 'modified', label: 'Modified', count: statusCounts.modified },
                    { value: 'deleted', label: 'Deleted', count: statusCounts.deleted },
                    { value: 'renamed', label: 'Renamed', count: statusCounts.renamed },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value as typeof status)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs",
                        status === opt.value ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2"><FileCode className="h-3 w-3" />{opt.label}</span>
                      <span className={cn("font-mono text-xs px-1.5 py-0.5 rounded", status === opt.value ? "bg-primary/20" : "bg-muted")}>{opt.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-2 space-y-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-2.5 py-2 rounded-md border border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-2.5 w-8" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : !selection?.commitSha ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <FileCode className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Select a commit first</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <FileCode className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{files.length === 0 ? 'No files changed' : 'No matches'}</p>
            {filter && (
              <button onClick={() => setFilter('')} className="text-xs text-primary hover:underline mt-1">Clear filter</button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFiles.map((file) => {
              const reviewStatus = fileReviews.get(file.filename)
              const isDone = reviewStatus === 'done'
              
              return (
                <button
                  key={file.filename}
                  onClick={() => handleFileClick(file)}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-md border transition-all',
                    selection?.filePath === file.filename
                      ? 'bg-primary/10 border-primary/50 shadow-sm'
                      : 'border-transparent hover:bg-muted/50 hover:border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <FileCode className={cn(
                        "h-3 w-3 flex-shrink-0",
                        file.status === 'added' && "text-emerald-600 dark:text-emerald-400",
                        file.status === 'deleted' && "text-red-600 dark:text-red-400",
                        file.status === 'modified' && "text-amber-600 dark:text-amber-400",
                        file.status === 'renamed' && "text-blue-600 dark:text-blue-400",
                        !['added', 'deleted', 'modified', 'renamed'].includes(file.status) && 
                          (selection?.filePath === file.filename ? "text-primary" : "text-muted-foreground")
                      )} />
                    )}
                    <span className="font-mono text-xs truncate flex-1">{file.filename}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{file.additions}</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">-{file.deletions}</span>
                    </div>
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
