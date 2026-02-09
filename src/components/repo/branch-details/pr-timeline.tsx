'use client'

import { memo, useMemo } from 'react'
import { GitCommit, GitMerge, GitPullRequest, MessageSquare, Tag, User, CheckCircle2, XCircle } from 'lucide-react'
import { TimelineEvent } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

interface PRTimelineProps {
  events: TimelineEvent[]
  loading?: boolean
}

function getEventIcon(event: TimelineEvent) {
  switch (event.event) {
    case 'committed':
      return <GitCommit className="h-4 w-4" />
    case 'merged':
      return <GitMerge className="h-4 w-4 text-purple-600" />
    case 'closed':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'reopened':
      return <GitPullRequest className="h-4 w-4 text-emerald-600" />
    case 'commented':
      return <MessageSquare className="h-4 w-4 text-blue-600" />
    case 'reviewed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    case 'labeled':
    case 'unlabeled':
      return <Tag className="h-4 w-4" />
    case 'assigned':
    case 'unassigned':
    case 'review_requested':
    case 'review_request_removed':
      return <User className="h-4 w-4" />
    default:
      return <GitCommit className="h-4 w-4" />
  }
}

function getEventDescription(event: TimelineEvent) {
  const actor = event.actor?.login || 'Someone'
  
  switch (event.event) {
    case 'committed':
      return (
        <div>
          <span className="font-medium">{actor}</span> committed
          {event.message && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{event.message.split('\n')[0]}</p>
          )}
        </div>
      )
    case 'merged':
      return <><span className="font-medium">{actor}</span> merged this</>
    case 'closed':
      return <><span className="font-medium">{actor}</span> closed this</>
    case 'reopened':
      return <><span className="font-medium">{actor}</span> reopened this</>
    case 'commented':
      return (
        <div>
          <span className="font-medium">{actor}</span> commented
          {event.body && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.body}</p>
          )}
        </div>
      )
    case 'reviewed':
      return <><span className="font-medium">{actor}</span> reviewed</>
    case 'labeled':
      return <><span className="font-medium">{actor}</span> added <span className="font-mono text-xs">{event.label?.name}</span></>
    case 'unlabeled':
      return <><span className="font-medium">{actor}</span> removed <span className="font-mono text-xs">{event.label?.name}</span></>
    case 'assigned':
      return <><span className="font-medium">{actor}</span> assigned <span className="font-medium">{event.assignee?.login}</span></>
    case 'unassigned':
      return <><span className="font-medium">{actor}</span> unassigned <span className="font-medium">{event.assignee?.login}</span></>
    case 'review_requested':
      return <><span className="font-medium">{actor}</span> requested review from <span className="font-medium">{event.reviewer?.login}</span></>
    case 'review_request_removed':
      return <><span className="font-medium">{actor}</span> removed review request from <span className="font-medium">{event.reviewer?.login}</span></>
    case 'head_ref_force_pushed':
      return <><span className="font-medium">{actor}</span> force-pushed</>
    case 'base_ref_changed':
      return <><span className="font-medium">{actor}</span> changed the base branch</>
    default:
      return <><span className="font-medium">{actor}</span> {event.event}</>
  }
}

export const PRTimeline = memo(function PRTimeline({ events, loading }: PRTimelineProps) {
  // Filter out events with invalid dates
  const validEvents = useMemo(() => {
    return events.filter(event => {
      if (!event.created_at) return false
      const date = new Date(event.created_at)
      return !isNaN(date.getTime())
    })
  }, [events])

  if (loading) {
    return (
      <Card className="p-5 space-y-4 card-elevated">
        <h3 className="font-semibold text-base">Timeline</h3>
        <div className="space-y-4" role="status" aria-label="Loading timeline">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (validEvents.length === 0) {
    return (
      <Card className="p-5 card-elevated">
        <h3 className="font-semibold text-base mb-3">Timeline</h3>
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </Card>
    )
  }

  return (
    <Card className="p-5 space-y-4 card-elevated">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Timeline</h3>
        <span className="text-xs text-muted-foreground">{validEvents.length} events</span>
      </div>
      <ol className="space-y-6" role="list" aria-label="Pull request timeline">
        {validEvents.map((event, index) => (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div 
                className="p-2 rounded-full bg-muted/80 flex-shrink-0 border border-border"
                aria-hidden="true"
              >
                {getEventIcon(event)}
              </div>
              {index < validEvents.length - 1 && (
                <div className="w-px flex-1 bg-border mt-2" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="text-sm leading-relaxed">
                {getEventDescription(event)}
              </div>
              <time 
                className="text-xs text-muted-foreground mt-1.5 block"
                dateTime={event.created_at}
              >
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
})
