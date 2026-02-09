'use client'

import { memo } from 'react'
import { GitPullRequest, GitBranch, FileText } from 'lucide-react'
import { PRDetails } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ReviewReadinessIndicator } from '@/components/repo/review/review-readiness-indicator'
import { EffortSignal } from '@/components/repo/review/effort-signal'
import { PRReviewProgress } from '@/lib/review-progress'
import { PREffortMetrics } from '@/lib/effort-metrics'

interface PROverviewCardProps {
  pr: PRDetails
  actionButton?: React.ReactNode
  reviewProgress?: PRReviewProgress | null
  effortMetrics?: PREffortMetrics | null
}

export const PROverviewCard = memo(function PROverviewCard({ pr, actionButton, reviewProgress, effortMetrics }: PROverviewCardProps) {
  return (
    <div 
      className="bg-card rounded-lg border border-border card-elevated p-6 space-y-4"
      role="region"
      aria-label="Pull request overview"
    >
      {/* Header with title, status, and action button */}
      <div className="flex items-start gap-4">
        <div 
          className={cn(
            "p-2.5 rounded-lg flex-shrink-0",
            pr.state === 'open' && "bg-emerald-500/10",
            pr.state === 'merged' && "bg-purple-500/10",
            pr.state === 'closed' && "bg-red-500/10"
          )}
          aria-hidden="true"
        >
          <GitPullRequest className={cn(
            "h-6 w-6",
            pr.state === 'open' && "text-emerald-600 dark:text-emerald-400",
            pr.state === 'merged' && "text-purple-600 dark:text-purple-400",
            pr.state === 'closed' && "text-red-600 dark:text-red-400"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold mb-2 leading-tight" id="pr-title">{pr.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={pr.state === 'open' ? 'default' : 'secondary'} 
                  className={cn(
                    "capitalize font-medium",
                    pr.state === 'open' && "bg-emerald-600 hover:bg-emerald-700",
                    pr.state === 'merged' && "bg-purple-600 hover:bg-purple-700",
                    pr.state === 'closed' && "bg-red-600 hover:bg-red-700"
                  )}
                  aria-label={`Pull request state: ${pr.state}`}
                >
                  {pr.state}
                </Badge>
                {pr.draft && <Badge variant="outline" aria-label="Draft pull request">Draft</Badge>}
                <span className="text-muted-foreground">•</span>
                <span className="font-mono text-sm text-muted-foreground" aria-label={`Pull request number ${pr.number}`}>#{pr.number}</span>
              </div>
            </div>
            {actionButton && (
              <div className="flex-shrink-0">
                {actionButton}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author and timestamp */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <img 
          src={pr.author.avatar_url} 
          alt={`${pr.author.login}'s avatar`} 
          className="h-5 w-5 rounded-full" 
        />
        <span className="font-medium text-foreground">{pr.author.login}</span>
        <span>opened {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}</span>
      </div>

      {/* Review Progress and Effort Metrics */}
      {reviewProgress && effortMetrics && (
        <div className="space-y-2 pt-2 border-t">
          <ReviewReadinessIndicator 
            status={reviewProgress.status} 
            progress={reviewProgress} 
          />
          <EffortSignal metrics={effortMetrics} />
        </div>
      )}

      {/* Branch information - more prominent */}
      <div className="bg-muted/50 rounded-md p-3" role="group" aria-label="Branch information">
        <div className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <span className="font-mono font-medium">{pr.sourceBranch}</span>
          <span className="text-muted-foreground" aria-label="merging into">→</span>
          <span className="font-mono font-medium">{pr.targetBranch}</span>
        </div>
      </div>

      {/* Stats - cleaner layout */}
      <div 
        className="flex items-center gap-6 text-sm flex-wrap pt-2"
        role="group"
        aria-label="Pull request statistics"
      >
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{pr.commits_count}</span>
          <span className="text-muted-foreground">{pr.commits_count === 1 ? 'commit' : 'commits'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{pr.changed_files}</span>
          <span className="text-muted-foreground">{pr.changed_files === 1 ? 'file' : 'files'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-medium" aria-label={`${pr.additions} additions`}>+{pr.additions}</span>
          <span className="text-red-600 font-medium" aria-label={`${pr.deletions} deletions`}>-{pr.deletions}</span>
        </div>
      </div>

      {/* Labels */}
      {pr.labels.length > 0 && (
        <div 
          className="flex items-center gap-2 flex-wrap pt-2 border-t"
          role="group"
          aria-label="Pull request labels"
        >
          {pr.labels.map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              className="font-normal"
              style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
              title={label.description || label.name}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
})
