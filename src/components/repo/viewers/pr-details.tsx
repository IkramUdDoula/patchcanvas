'use client'

import { useMemo } from 'react'
import { 
  GitPullRequest, 
  GitMerge, 
  XCircle, 
  Clock,
  ArrowRight,
  GitBranch
} from 'lucide-react'
import { usePRDetails, usePRFiles, useCommits, usePRReviews, usePRChecks } from '@/components/repo/hooks/use-repo-data'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { PRMergeButton } from '@/components/repo/branch-details/pr-merge-button'
import { useCallback } from 'react'
import { calculatePRIntelligence } from '@/lib/pr-intelligence'

interface PRDetailsProps {
  owner: string
  repo: string
  prNumber: number
}

export function PRDetails({ owner, repo, prNumber }: PRDetailsProps) {
  const { prDetails, loading: detailsLoading, refetch: refetchDetails } = usePRDetails(owner, repo, prNumber)
  const { files, loading: filesLoading, refetch: refetchFiles } = usePRFiles(owner, repo, prNumber)
  const { commits, loading: commitsLoading, refetch: refetchCommits } = useCommits(owner, repo, prNumber, null)
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = usePRReviews(owner, repo, prNumber)
  const { checks, loading: checksLoading, refetch: refetchChecks } = usePRChecks(owner, repo, prNumber)
  const { selectCommit } = useRepoExplorerStore()

  // Handle merge/close success - refetch all data
  const handleActionSuccess = useCallback(() => {
    refetchDetails()
    refetchFiles()
    refetchCommits()
    refetchReviews()
    refetchChecks()
  }, [refetchDetails, refetchFiles, refetchCommits, refetchReviews, refetchChecks])

  // PR-level intelligence computed once per PR
  const intelligence = useMemo(() => {
    if (!prDetails || files.length === 0) return null
    
    return calculatePRIntelligence(
      prDetails.additions,
      prDetails.deletions,
      prDetails.changed_files,
      prDetails.mergeable_state === 'dirty',
      files,
      commits
    )
  }, [prDetails, files, commits])

  // Derived guidance values (now included in intelligence)
  const mostSensitiveBehavior = intelligence?.guidance.mostSensitiveBehavior ?? 'No sensitive areas detected'
  const reviewOrderHint = intelligence?.guidance.reviewOrderHint ?? 'Review files by impact'

  // Check if shared/core components are touched
  const touchesSharedComponents = intelligence ? intelligence.changeBreakdown.shared > 0 : false

  const isLoading = detailsLoading || filesLoading || commitsLoading || reviewsLoading || checksLoading

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-muted/30 p-4">
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!prDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <GitPullRequest className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Pull request not found</p>
        </div>
      </div>
    )
  }

  const stateConfig = {
    open: { 
      icon: GitPullRequest, 
      label: 'Open', 
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
    },
    closed: { 
      icon: XCircle, 
      label: 'Closed', 
      className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' 
    },
    merged: { 
      icon: GitMerge, 
      label: 'Merged', 
      className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' 
    },
  }
  const config = stateConfig[prDetails.state as keyof typeof stateConfig] || stateConfig.open

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* PR Info Bar */}
      <div className="px-4 py-3 border-b border-border/50 bg-card">
        <div className="flex items-start gap-3 mb-3">
          <config.icon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm font-mono font-semibold flex-1 leading-relaxed">
            {prDetails.title.substring(0, 200)}
            {prDetails.title.length > 200 && '...'}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Merge and Close buttons */}
            {prDetails.state === 'open' && (
              <PRMergeButton
                pr={prDetails}
                checks={checks}
                reviews={reviews}
                onMergeSuccess={handleActionSuccess}
                onCloseSuccess={handleActionSuccess}
              />
            )}
            {prDetails.draft && (
              <Badge variant="outline" className="text-xs">
                Draft
              </Badge>
            )}
          </div>
        </div>
        
        {/* Branch info and PR number */}
        {prDetails.sourceBranch && prDetails.targetBranch && (
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <GitBranch className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <code className="font-mono text-purple-600 dark:text-purple-400">{prDetails.sourceBranch}</code>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <code className="font-mono text-purple-600 dark:text-purple-400">{prDetails.targetBranch}</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                #{prNumber}
              </Badge>
              <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 font-semibold border', config.className)}>
                {config.label}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Stats and metadata */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          {/* Stats */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-green-600 dark:text-green-400">+{prDetails.additions}</span>
            <span className="text-red-600 dark:text-red-400">-{prDetails.deletions}</span>
            <span className="text-muted-foreground">
              ({prDetails.changed_files} {prDetails.changed_files === 1 ? 'file' : 'files'})
            </span>
          </div>
          
          {/* Author */}
          <div className="flex items-center gap-2 pl-4 border-l border-border/50">
            <Avatar className="h-5 w-5">
              <AvatarImage src={prDetails.author.avatar_url} alt={prDetails.author.login} />
              <AvatarFallback className="text-xs">{prDetails.author.login[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{prDetails.author.login}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-2 pl-4 border-l border-border/50">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(prDetails.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Details Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION: COMMITS
            - List of all commits with descriptions
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="p-3 rounded-lg border border-border/50 bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Commits
          </div>
          {commits && commits.length > 0 ? (
            <div className="space-y-3">
              {commits.map((commit) => {
                // Truncate message to first 30 words
                const words = commit.message.split(' ')
                const truncatedMessage = words.length > 30 
                  ? words.slice(0, 30).join(' ') + '...'
                  : commit.message
                
                return (
                  <div 
                    key={commit.sha}
                    className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50"
                    onClick={() => selectCommit(commit.sha)}
                  >
                    {/* Hash tag and datetime */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className="font-mono text-[10px] px-2 py-0.5 bg-muted hover:bg-muted"
                      >
                        {commit.abbreviatedSha}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(commit.author.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {/* Commit message */}
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {truncatedMessage}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No commits</p>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION: REVIEW GUIDANCE (REASONING NOTES)
            - Plain text list, no icons, no paragraphs
            - Max three rows, declarative tone only
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="overflow-hidden rounded-lg border border-border/50">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="py-2 px-3 text-[11px] text-muted-foreground bg-muted/30 w-40">
                  Highest impact area
                </td>
                <td className="py-2 px-3 font-medium">
                  {intelligence?.guidance.highestImpactArea || 'No changes'}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-[11px] text-muted-foreground bg-muted/30 w-40">
                  Most sensitive behavior
                </td>
                <td className="py-2 px-3 font-medium">
                  {mostSensitiveBehavior}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-[11px] text-muted-foreground bg-muted/30 w-40">
                  Review order hint
                </td>
                <td className="py-2 px-3 font-medium">
                  {reviewOrderHint}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION: CHANGE PROFILE (INTERPRETATION LAYER)
            - GitHub-style visual representation with progress bars
            - Two-column layout for metrics
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="p-4 rounded-xl border border-border/60 bg-card/50 space-y-4">
          <div className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            Change Profile
          </div>
          
          {/* Distribution section */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Distribution
            </div>
            {intelligence ? (
              <>
                {/* Progress bar */}
                {(() => {
                  const total = intelligence.changeBreakdown.ui + intelligence.changeBreakdown.logic + intelligence.changeBreakdown.shared
                  if (total === 0) return null
                  const uiPercent = (intelligence.changeBreakdown.ui / total) * 100
                  const logicPercent = (intelligence.changeBreakdown.logic / total) * 100
                  const sharedPercent = (intelligence.changeBreakdown.shared / total) * 100
                  
                  return (
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-3">
                      {intelligence.changeBreakdown.ui > 0 && (
                        <div className="bg-blue-500" style={{ width: `${uiPercent}%` }} />
                      )}
                      {intelligence.changeBreakdown.logic > 0 && (
                        <div className="bg-yellow-500" style={{ width: `${logicPercent}%` }} />
                      )}
                      {intelligence.changeBreakdown.shared > 0 && (
                        <div className="bg-pink-500" style={{ width: `${sharedPercent}%` }} />
                      )}
                    </div>
                  )
                })()}
                
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                  {intelligence.changeBreakdown.ui > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">UI</span>
                      <span className="font-bold tabular-nums">{intelligence.changeBreakdown.ui}</span>
                    </div>
                  )}
                  {intelligence.changeBreakdown.logic > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <span className="text-muted-foreground">Logic</span>
                      <span className="font-bold tabular-nums">{intelligence.changeBreakdown.logic}</span>
                    </div>
                  )}
                  {intelligence.changeBreakdown.shared > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                      <span className="text-muted-foreground">Shared</span>
                      <span className="font-bold tabular-nums">{intelligence.changeBreakdown.shared}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No data</span>
            )}
          </div>

          {/* Commit types section */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Commit types
            </div>
            {intelligence ? (
              <>
                {/* Progress bar */}
                {(() => {
                  const total = intelligence.commitComposition.behavioral + intelligence.commitComposition.refactor + intelligence.commitComposition.mechanical
                  if (total === 0) return null
                  const featurePercent = (intelligence.commitComposition.behavioral / total) * 100
                  const refactorPercent = (intelligence.commitComposition.refactor / total) * 100
                  const fixPercent = (intelligence.commitComposition.mechanical / total) * 100
                  
                  return (
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-3">
                      {intelligence.commitComposition.behavioral > 0 && (
                        <div className="bg-green-500" style={{ width: `${featurePercent}%` }} />
                      )}
                      {intelligence.commitComposition.refactor > 0 && (
                        <div className="bg-orange-500" style={{ width: `${refactorPercent}%` }} />
                      )}
                      {intelligence.commitComposition.mechanical > 0 && (
                        <div className="bg-cyan-500" style={{ width: `${fixPercent}%` }} />
                      )}
                    </div>
                  )
                })()}
                
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                  {intelligence.commitComposition.behavioral > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Feature</span>
                      <span className="font-bold tabular-nums">{intelligence.commitComposition.behavioral}</span>
                    </div>
                  )}
                  {intelligence.commitComposition.refactor > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      <span className="text-muted-foreground">Refactor</span>
                      <span className="font-bold tabular-nums">{intelligence.commitComposition.refactor}</span>
                    </div>
                  )}
                  {intelligence.commitComposition.mechanical > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      <span className="text-muted-foreground">Fix</span>
                      <span className="font-bold tabular-nums">{intelligence.commitComposition.mechanical}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No data</span>
            )}
          </div>

          {/* Shared/core indicator */}
          {touchesSharedComponents && (
            <div className="pt-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                  Touches shared components
                </span>
              </div>
            </div>
          )}
        </section>



          {/* Labels - if present */}
          {prDetails.labels && prDetails.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prDetails.labels.map((label) => (
                <Badge 
                  key={label.id} 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0"
                  style={{ 
                    borderColor: `#${label.color}`,
                    color: `#${label.color}`
                  }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
