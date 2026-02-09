'use client'

import { useEffect, useState, useMemo } from 'react'
import { AlertCircle, FileCode, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { FileDiff } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useReviewStateStore } from '@/stores/review-state-store'
import { usePRFiles, useCommitFiles } from '@/components/repo/hooks/use-repo-data'
import { calculatePRReviewProgress } from '@/lib/review-progress'
import { ReviewReadinessIndicator } from '@/components/repo/review/review-readiness-indicator'

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    css: 'css',
    html: 'html',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sql: 'sql',
  }
  return langMap[ext || ''] || 'typescript'
}

function parseHunkHeader(header: string) {
  // Parse @@ -99,9 +99,17 @@ export default function CreateReceiptPage() {
  const match = header.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@ (.*)/)
  if (!match) return { context: header, oldStart: 0, oldCount: 0, newStart: 0, newCount: 0 }
  
  const [, oldStart, oldCount, newStart, newCount, context] = match
  return {
    oldStart: parseInt(oldStart),
    oldCount: parseInt(oldCount),
    newStart: parseInt(newStart),
    newCount: parseInt(newCount),
    context: context.trim() || 'Code change'
  }
}

function parseGitHubPatch(patch: string) {
  const hunks: any[] = []
  const lines = patch.split('\n')
  let currentHunk: any = null
  let hunkIndex = 0
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      // New hunk
      if (currentHunk) {
        hunks.push(currentHunk)
      }
      const parsed = parseHunkHeader(line)
      currentHunk = {
        id: `hunk-${hunkIndex++}`,
        oldStart: parsed.oldStart,
        oldLines: parsed.oldCount,
        newStart: parsed.newStart,
        newLines: parsed.newCount,
        header: line,
        lines: []
      }
    } else if (currentHunk) {
      // Add line to current hunk
      const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'delete' : 'context'
      currentHunk.lines.push({
        type,
        content: line.substring(1), // Remove +/- prefix
        oldLineNumber: type === 'add' ? null : currentHunk.oldStart + currentHunk.lines.filter((l: any) => l.type !== 'add').length,
        newLineNumber: type === 'delete' ? null : currentHunk.newStart + currentHunk.lines.filter((l: any) => l.type !== 'delete').length
      })
    }
  }
  
  if (currentHunk) {
    hunks.push(currentHunk)
  }
  
  return hunks
}

interface InteractiveDiffViewerProps {
  owner: string
  repo: string
  filePath: string
  base: string
  head: string
}

export function InteractiveDiffViewer({
  owner,
  repo,
  filePath,
  base,
  head,
}: InteractiveDiffViewerProps) {
  const [diff, setDiff] = useState<FileDiff | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'unified' | 'split'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('diff-view-mode') as 'unified' | 'split') || 'unified'
    }
    return 'unified'
  })
  const [reviewIndividually, setReviewIndividually] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('diff-review-individually') === 'true'
    }
    return false
  })
  const [currentHunkIndex, setCurrentHunkIndex] = useState(0)

  // Get selection context for review progress
  const selection = useRepoExplorerStore().selection
  const getPRReviewStates = useReviewStateStore().getPRReviewStates
  const getCommitReviewStates = useReviewStateStore().getCommitReviewStates
  
  // Fetch files for review progress calculation
  const { files: prFiles } = usePRFiles(owner, repo, selection?.prNumber ?? 0)
  const { files: commitFiles } = useCommitFiles(owner, repo, selection?.commitSha ?? '')
  
  // Calculate review progress based on context (PR or commit)
  const reviewProgress = useMemo(() => {
    if (selection?.prNumber) {
      const files = prFiles
      if (!files.length) return null
      const fileReviewStates = getPRReviewStates(selection.prNumber)
      
      if (fileReviewStates.length === 0) {
        const initialStates = files.map(file => ({
          prNumber: selection.prNumber!,
          filename: file.filename,
          state: 'not_reviewed' as const
        }))
        return calculatePRReviewProgress(initialStates)
      }
      return calculatePRReviewProgress(fileReviewStates)
    } else if (selection?.commitSha) {
      const files = commitFiles
      if (!files.length) return null
      const fileReviewStates = getCommitReviewStates(selection.commitSha)
      
      if (fileReviewStates.length === 0) {
        const initialStates = files.map(file => ({
          commitSha: selection.commitSha!,
          filename: file.filename,
          state: 'not_reviewed' as const
        }))
        return calculatePRReviewProgress(initialStates)
      }
      return calculatePRReviewProgress(fileReviewStates)
    }
    return null
  }, [selection?.prNumber, selection?.commitSha, prFiles, commitFiles, getPRReviewStates, getCommitReviewStates])

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `/api/repos?action=diff&owner=${owner}&repo=${repo}&base=${base}&head=${head}`
        )

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch diff')
        }

        const data = await response.json()
        
        // Find the specific file from the comparison
        const file = data.files?.find((f: any) => f.filename === filePath)
        
        if (!file) {
          throw new Error('File not found in diff')
        }
        
        // Convert GitHub API format to FileDiff format
        const fileDiff: FileDiff = {
          path: file.filename,
          oldPath: file.previous_filename || null,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          hunks: file.patch ? parseGitHubPatch(file.patch) : []
        }
        
        setDiff(fileDiff)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiff()
  }, [owner, repo, filePath, base, head])

  // Save view mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('diff-view-mode', viewMode)
    }
  }, [viewMode])

  // Save review individually setting to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('diff-review-individually', reviewIndividually.toString())
    }
  }, [reviewIndividually])

  // Reset hunk index when switching files or toggling review mode
  useEffect(() => {
    setCurrentHunkIndex(0)
  }, [filePath, reviewIndividually])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-muted/30 p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load diff</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No changes to display</p>
        </div>
      </div>
    )
  }

  const language = getLanguageFromPath(diff.path)
  const totalHunks = diff.hunks.length
  const displayedHunks = reviewIndividually ? [diff.hunks[currentHunkIndex]] : diff.hunks

  const handlePreviousHunk = () => {
    setCurrentHunkIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextHunk = () => {
    setCurrentHunkIndex((prev) => Math.min(totalHunks - 1, prev + 1))
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* File Info Bar */}
      <div className="px-4 py-3 border-b border-border/50 bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-mono font-semibold">{diff.path}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={reviewIndividually}
                onCheckedChange={(checked) => setReviewIndividually(checked === true)}
                id="review-individually"
              />
              <span className="text-xs font-medium select-none">Review Individually</span>
            </label>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 border border-border/50">
              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-medium rounded transition-colors',
                  viewMode === 'unified' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                )}
              >
                Unified
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-medium rounded transition-colors',
                  viewMode === 'split' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                )}
              >
                Split
              </button>
            </div>
          </div>
        </div>
        
        {/* Review Progress */}
        {reviewProgress && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <ReviewReadinessIndicator status={reviewProgress.status} progress={reviewProgress} />
          </div>
        )}
      </div>

      {/* Hunks List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-3">
          {viewMode === 'unified' ? (
            <UnifiedView diff={{ ...diff, hunks: displayedHunks }} language={language} />
          ) : (
            <SplitView diff={{ ...diff, hunks: displayedHunks }} language={language} />
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {reviewIndividually && totalHunks > 1 && (
        <div className="px-4 py-3 border-t border-border/50 bg-card flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Hunk {currentHunkIndex + 1} of {totalHunks}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousHunk}
              disabled={currentHunkIndex === 0}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextHunk}
              disabled={currentHunkIndex === totalHunks - 1}
              className="h-7 px-2"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function UnifiedView({ diff, language }: { diff: FileDiff; language: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <TooltipProvider>
      {diff.hunks.map((hunk) => {
        const parsed = parseHunkHeader(hunk.header)
        const addedCount = hunk.lines.filter((l) => l.type === 'add').length
        const deletedCount = hunk.lines.filter((l) => l.type === 'delete').length

        return (
          <div
            key={hunk.id}
            className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all"
          >
            {/* Header */}
            <div className="bg-muted px-3 py-2 border-b border-border/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{addedCount} added
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{deletedCount} removed
                  </span>
                </div>
                <span className="text-[11px] text-foreground/80 truncate font-medium">
                  {parsed.context}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex-shrink-0 p-0.5 hover:bg-muted-foreground/10 rounded transition-colors">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-mono text-xs max-w-md">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground mb-1">Technical Format:</div>
                      <div className="text-muted-foreground">{hunk.header}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-2 space-y-0.5">
                        <div>Old: Lines {parsed.oldStart}-{parsed.oldStart + parsed.oldCount - 1} ({parsed.oldCount} lines)</div>
                        <div>New: Lines {parsed.newStart}-{parsed.newStart + parsed.newCount - 1} ({parsed.newCount} lines)</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Lines */}
            <div className="font-mono text-[11px]">
              {hunk.lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={cn(
                  'flex items-center relative hover:bg-muted/30',
                  line.type === 'add' && 'bg-emerald-500/10',
                  line.type === 'delete' && 'bg-red-500/10'
                )}
              >
                {/* Colored vertical line indicator */}
                {line.type !== 'context' && (
                  <div
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-1',
                      line.type === 'add' && 'bg-emerald-500',
                      line.type === 'delete' && 'bg-red-500'
                    )}
                  />
                )}

                {/* Line Numbers */}
                <div className="flex items-center gap-0 select-none">
                  <span className="w-10 text-right px-2 py-0.5 text-[10px] text-muted-foreground border-r border-border/50">
                    {line.oldLineNumber || ''}
                  </span>
                  <span className="w-10 text-right px-2 py-0.5 text-[10px] text-muted-foreground border-r border-border/50">
                    {line.newLineNumber || ''}
                  </span>
                </div>

                {/* Change Indicator */}
                <div
                  className={cn(
                    'w-6 flex items-center justify-center flex-shrink-0 py-0.5',
                    line.type === 'add' && 'text-emerald-600 dark:text-emerald-400',
                    line.type === 'delete' && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {line.type === 'add' && '+'}
                  {line.type === 'delete' && '-'}
                </div>

                {/* Content */}
                <div className="flex-1 px-3 py-0.5 overflow-hidden">
                  <SyntaxHighlighter
                    language={language}
                    style={isDark ? oneDark : oneLight}
                    customStyle={{
                      margin: 0,
                      padding: 0,
                      background: 'transparent',
                      fontSize: '11px',
                      lineHeight: '1.2',
                    }}
                    codeTagProps={{
                      style: {
                        background: 'transparent',
                        fontFamily: 'inherit',
                      },
                    }}
                    PreTag="span"
                  >
                    {line.content || ' '}
                  </SyntaxHighlighter>
                </div>
              </div>
            ))}
            </div>
          </div>
        )
      })}
    </TooltipProvider>
  )
}

function SplitView({ diff, language }: { diff: FileDiff; language: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <TooltipProvider>
      {diff.hunks.map((hunk) => {
        const parsed = parseHunkHeader(hunk.header)
        const addedCount = hunk.lines.filter((l) => l.type === 'add').length
        const deletedCount = hunk.lines.filter((l) => l.type === 'delete').length
        const deletions = hunk.lines.filter((l) => l.type === 'delete' || l.type === 'context')
        const additions = hunk.lines.filter((l) => l.type === 'add' || l.type === 'context')

        return (
          <div
            key={hunk.id}
            className="rounded-lg border border-border/50 overflow-hidden bg-card"
          >
            {/* Header */}
            <div className="bg-muted px-3 py-2 border-b border-border/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{addedCount} added
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{deletedCount} removed
                  </span>
                </div>
                <span className="text-[11px] text-foreground/80 truncate font-medium">
                  {parsed.context}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex-shrink-0 p-0.5 hover:bg-muted-foreground/10 rounded transition-colors">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-mono text-xs max-w-md">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground mb-1">Technical Format:</div>
                      <div className="text-muted-foreground">{hunk.header}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-2 space-y-0.5">
                        <div>Old: Lines {parsed.oldStart}-{parsed.oldStart + parsed.oldCount - 1} ({parsed.oldCount} lines)</div>
                        <div>New: Lines {parsed.newStart}-{parsed.newStart + parsed.newCount - 1} ({parsed.newCount} lines)</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-2 divide-x divide-border/50 font-mono text-[11px]">
              {/* Before (Deletions) */}
              <div className="bg-card">
                <div className="bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b border-border/50">
                  Before
                </div>
                {deletions.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center relative hover:bg-muted/30',
                      line.type === 'delete' && 'bg-red-500/10'
                    )}
                  >
                    {/* Colored vertical line indicator */}
                    {line.type === 'delete' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                    )}

                    <span className="w-10 text-right px-2 py-0.5 text-[10px] text-muted-foreground border-r border-border/50 select-none">
                      {line.oldLineNumber || ''}
                    </span>
                    <div
                      className={cn(
                        'w-6 flex items-center justify-center flex-shrink-0',
                        line.type === 'delete' && 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {line.type === 'delete' && '-'}
                    </div>
                    <div className="flex-1 px-2 py-0.5 overflow-hidden">
                      <SyntaxHighlighter
                        language={language}
                        style={isDark ? oneDark : oneLight}
                        customStyle={{
                          margin: 0,
                          padding: 0,
                          background: 'transparent',
                          fontSize: '11px',
                          lineHeight: '1.2',
                        }}
                        codeTagProps={{
                          style: {
                            background: 'transparent',
                            fontFamily: 'inherit',
                          },
                        }}
                        PreTag="span"
                      >
                        {line.content || ' '}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                ))}
              </div>

              {/* After (Additions) */}
              <div className="bg-card">
                <div className="bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground border-b border-border/50">
                  After
                </div>
                {additions.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center relative hover:bg-muted/30',
                      line.type === 'add' && 'bg-emerald-500/10'
                    )}
                  >
                    {/* Colored vertical line indicator */}
                    {line.type === 'add' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    )}

                    <span className="w-10 text-right px-2 py-0.5 text-[10px] text-muted-foreground border-r border-border/50 select-none">
                      {line.newLineNumber || ''}
                    </span>
                    <div
                      className={cn(
                        'w-6 flex items-center justify-center flex-shrink-0',
                        line.type === 'add' && 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {line.type === 'add' && '+'}
                    </div>
                    <div className="flex-1 px-2 py-0.5 overflow-hidden">
                      <SyntaxHighlighter
                        language={language}
                        style={isDark ? oneDark : oneLight}
                        customStyle={{
                          margin: 0,
                          padding: 0,
                          background: 'transparent',
                          fontSize: '11px',
                          lineHeight: '1.2',
                        }}
                        codeTagProps={{
                          style: {
                            background: 'transparent',
                            fontFamily: 'inherit',
                          },
                        }}
                        PreTag="span"
                      >
                        {line.content || ' '}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </TooltipProvider>
  )
}
