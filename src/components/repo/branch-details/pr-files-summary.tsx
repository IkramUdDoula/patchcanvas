'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { FileText, FilePlus, FileX, FileEdit, Search, Circle, CircleDashed, CheckCircle2 } from 'lucide-react'
import { PRFile } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useReviewStateStore, FileReviewState } from '@/stores/review-state-store'
import { cn } from '@/lib/utils'

interface PRFilesSummaryProps {
  files: PRFile[]
  prNumber: number
  loading?: boolean
  compact?: boolean
}

export const PRFilesSummary = memo(function PRFilesSummary({ files, prNumber, loading, compact = false }: PRFilesSummaryProps) {
  const [filter, setFilter] = useState('')
  const reviewStore = useReviewStateStore()
  const getFileReviewState = reviewStore.getFileReviewState
  const setFileReviewState = reviewStore.setFileReviewState

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value)
  }, [])

  const handleReviewStateClick = useCallback((filename: string, currentState: FileReviewState) => {
    // Cycle through states: not_reviewed -> in_review -> reviewed -> not_reviewed
    const nextState: FileReviewState = 
      currentState === 'not_reviewed' ? 'in_review' :
      currentState === 'in_review' ? 'reviewed' :
      'not_reviewed'
    
    setFileReviewState(prNumber, filename, nextState)
  }, [prNumber, setFileReviewState])

  const getReviewStateIcon = (state: FileReviewState) => {
    switch (state) {
      case 'not_reviewed':
        return <Circle className="h-4 w-4 text-muted-foreground" />
      case 'in_review':
        return <CircleDashed className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      case 'reviewed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    }
  }

  const getReviewStateLabel = (state: FileReviewState) => {
    switch (state) {
      case 'not_reviewed':
        return 'Not reviewed'
      case 'in_review':
        return 'In review'
      case 'reviewed':
        return 'Reviewed'
    }
  }

  const filteredFiles = useMemo(() => {
    if (!filter) return files
    return files.filter(file => 
      file.filename.toLowerCase().includes(filter.toLowerCase())
    )
  }, [files, filter])

  const stats = useMemo(() => {
    return {
      added: files.filter(f => f.status === 'added').length,
      modified: files.filter(f => f.status === 'modified').length,
      deleted: files.filter(f => f.status === 'deleted').length,
      renamed: files.filter(f => f.status === 'renamed').length,
    }
  }, [files])

  const filesByExtension = useMemo(() => {
    const grouped = new Map<string, PRFile[]>()
    files.forEach(file => {
      const ext = file.filename.split('.').pop() || 'no extension'
      if (!grouped.has(ext)) {
        grouped.set(ext, [])
      }
      grouped.get(ext)!.push(file)
    })
    return Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [files])

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <FilePlus className="h-4 w-4 text-emerald-600" />
      case 'deleted':
        return <FileX className="h-4 w-4 text-red-600" />
      case 'modified':
        return <FileEdit className="h-4 w-4 text-blue-600" />
      case 'renamed':
        return <FileText className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <Card className="p-5 space-y-4 card-elevated">
        <h3 className="font-semibold text-base">Files Changed</h3>
        <div className="space-y-3" role="status" aria-label="Loading files">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  if (files.length === 0) {
    return (
      <Card className="p-5 card-elevated">
        <h3 className="font-semibold text-base mb-3">Files Changed</h3>
        <p className="text-sm text-muted-foreground">No files changed</p>
      </Card>
    )
  }

  return (
    <Card className="p-5 space-y-4 card-elevated">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Files Changed</h3>
        <span className="text-xs text-muted-foreground">{files.length} files</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {stats.added > 0 && (
          <div className="flex items-center gap-2 bg-emerald-500/10 rounded-md px-3 py-2">
            <FilePlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span className="font-medium">{stats.added} added</span>
          </div>
        )}
        {stats.modified > 0 && (
          <div className="flex items-center gap-2 bg-blue-500/10 rounded-md px-3 py-2">
            <FileEdit className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="font-medium">{stats.modified} modified</span>
          </div>
        )}
        {stats.deleted > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 rounded-md px-3 py-2">
            <FileX className="h-4 w-4 text-red-600" aria-hidden="true" />
            <span className="font-medium">{stats.deleted} deleted</span>
          </div>
        )}
        {stats.renamed > 0 && (
          <div className="flex items-center gap-2 bg-purple-500/10 rounded-md px-3 py-2">
            <FileText className="h-4 w-4 text-purple-600" aria-hidden="true" />
            <span className="font-medium">{stats.renamed} renamed</span>
          </div>
        )}
      </div>

      {filesByExtension.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By Type</p>
          <div className="flex flex-wrap gap-2">
            {filesByExtension.slice(0, 8).map(([ext, extFiles]) => (
              <Badge key={ext} variant="outline" className="text-xs font-normal">
                .{ext} ({extFiles.length})
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Filter files..."
          value={filter}
          onChange={handleFilterChange}
          className="pl-9 h-9"
          aria-label="Filter files by name"
        />
      </div>

      <nav aria-label="Changed files">
        <ul className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
          {filteredFiles.map((file) => {
            const reviewState = getFileReviewState(prNumber, file.filename)
            return (
              <li key={file.filename} className="flex items-center gap-2">
                <button
                  onClick={() => handleReviewStateClick(file.filename, reviewState)}
                  className="flex-shrink-0 p-2 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`Mark ${file.filename} as ${getReviewStateLabel(reviewState)}`}
                  title={`Click to change review state (currently: ${getReviewStateLabel(reviewState)})`}
                >
                  {getReviewStateIcon(reviewState)}
                </button>
                <a
                  href={file.blob_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group text-sm focus:outline-none focus:ring-2 focus:ring-ring border border-transparent hover:border-border"
                  aria-label={`${file.filename}: ${file.additions} additions, ${file.deletions} deletions`}
                >
                  {getFileIcon(file.status)}
                  <span className="flex-1 truncate font-mono text-xs">
                    {file.filename}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="text-emerald-600">+{file.additions}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-600">-{file.deletions}</span>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {filter && filteredFiles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No files match "{filter}"
        </p>
      )}
    </Card>
  )
})
