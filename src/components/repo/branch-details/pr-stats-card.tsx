'use client'

import { memo, useMemo } from 'react'
import { GitCommit, FileText, MessageSquare, GitPullRequest, Clock, TrendingUp } from 'lucide-react'
import { PRDetails } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns'

interface PRStatsCardProps {
  pr: PRDetails
}

export const PRStatsCard = memo(function PRStatsCard({ pr }: PRStatsCardProps) {
  const stats = useMemo(() => {
    const createdDate = new Date(pr.createdAt)
    const now = new Date()
    const hoursOpen = differenceInHours(now, createdDate)
    const daysOpen = differenceInDays(now, createdDate)

    const avgChangesPerFile = pr.changed_files > 0 
      ? Math.round((pr.additions + pr.deletions) / pr.changed_files)
      : 0

    const avgCommitsPerDay = daysOpen > 0
      ? (pr.commits_count / daysOpen).toFixed(1)
      : pr.commits_count.toString()

    return {
      hoursOpen,
      daysOpen,
      avgChangesPerFile,
      avgCommitsPerDay,
      totalComments: pr.comments + pr.review_comments
    }
  }, [pr.createdAt, pr.commits_count, pr.changed_files, pr.additions, pr.deletions, pr.comments, pr.review_comments])

  return (
    <Card className="p-5 space-y-5 card-elevated">
      <h3 className="font-semibold text-base">Statistics</h3>
      
      {/* Primary stats - larger, more prominent */}
      <div className="grid grid-cols-2 gap-4" role="group" aria-label="Pull request statistics">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitCommit className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">Commits</span>
          </div>
          <p className="text-3xl font-bold" aria-label={`${pr.commits_count} commits`}>{pr.commits_count}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">Files</span>
          </div>
          <p className="text-3xl font-bold" aria-label={`${pr.changed_files} files changed`}>{pr.changed_files}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">Comments</span>
          </div>
          <p className="text-3xl font-bold" aria-label={`${stats.totalComments} comments`}>{stats.totalComments}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitPullRequest className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">Changes</span>
          </div>
          <p className="text-xl font-bold" aria-label={`${pr.additions} additions, ${pr.deletions} deletions`}>
            <span className="text-emerald-600">+{pr.additions}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-red-600">-{pr.deletions}</span>
          </p>
        </div>
      </div>

      {/* Secondary insights */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insights</h4>
        
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Time open</span>
            </dt>
            <dd className="font-semibold">
              {stats.daysOpen > 0 ? `${stats.daysOpen}d ${stats.hoursOpen % 24}h` : `${stats.hoursOpen}h`}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Avg changes/file</span>
            </dt>
            <dd className="font-semibold">{stats.avgChangesPerFile}</dd>
          </div>

          {stats.daysOpen > 0 && (
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <GitCommit className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Commits/day</span>
              </dt>
              <dd className="font-semibold">{stats.avgCommitsPerDay}</dd>
            </div>
          )}

          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Discussion</span>
            </dt>
            <dd className="font-semibold text-xs">
              {pr.comments} general • {pr.review_comments} review
            </dd>
          </div>
        </dl>
      </div>

      {/* Status timestamp */}
      {pr.state === 'merged' && pr.mergedAt && (
        <div className="border-t pt-3">
          <time className="text-xs text-muted-foreground flex items-center gap-1.5" dateTime={pr.mergedAt}>
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            Merged {formatDistanceToNow(new Date(pr.mergedAt), { addSuffix: true })}
          </time>
        </div>
      )}

      {pr.state === 'closed' && pr.closedAt && !pr.mergedAt && (
        <div className="border-t pt-3">
          <time className="text-xs text-muted-foreground flex items-center gap-1.5" dateTime={pr.closedAt}>
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            Closed {formatDistanceToNow(new Date(pr.closedAt), { addSuffix: true })}
          </time>
        </div>
      )}
    </Card>
  )
})
