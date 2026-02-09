'use client'

import { memo, useMemo } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Clock } from 'lucide-react'
import { PRReview, User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

interface PRReviewsPanelProps {
  reviews: PRReview[]
  requestedReviewers: User[]
  loading?: boolean
}

export const PRReviewsPanel = memo(function PRReviewsPanel({ reviews, requestedReviewers, loading }: PRReviewsPanelProps) {
  const allReviewers = useMemo(() => {
    return [
      ...reviews.map(r => ({ ...r.user, state: r.state, submitted_at: r.submitted_at })),
      ...requestedReviewers.map(r => ({ ...r, state: 'PENDING' as const, submitted_at: null }))
    ]
  }, [reviews, requestedReviewers])

  const reviewStats = useMemo(() => {
    const approved = reviews.filter(r => r.state === 'APPROVED').length
    const changesRequested = reviews.filter(r => r.state === 'CHANGES_REQUESTED').length
    const commented = reviews.filter(r => r.state === 'COMMENTED').length
    return { approved, changesRequested, commented }
  }, [reviews])

  if (loading) {
    return (
      <Card className="p-5 space-y-4 card-elevated">
        <h3 className="font-semibold text-base">Reviewers</h3>
        <div className="space-y-3" role="status" aria-label="Loading reviewers">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const getReviewStateLabel = (state: string) => {
    switch (state) {
      case 'APPROVED':
        return 'Approved'
      case 'CHANGES_REQUESTED':
        return 'Changes requested'
      case 'COMMENTED':
        return 'Commented'
      case 'PENDING':
        return 'Pending review'
      default:
        return state
    }
  }

  return (
    <Card className="p-5 space-y-4 card-elevated">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Reviewers</h3>
        {reviewStats.approved > 0 && (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5" aria-label={`${reviewStats.approved} approved`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {reviewStats.approved}
          </span>
        )}
      </div>
      {allReviewers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviewers assigned</p>
      ) : (
        <ul className="space-y-3" role="list" aria-label="Pull request reviewers">
          {allReviewers.map((reviewer) => (
            <li key={reviewer.id} className="flex items-center gap-3 text-sm">
              <img 
                src={reviewer.avatar_url} 
                alt={`${reviewer.login}'s avatar`}
                className="h-8 w-8 rounded-full border border-border"
              />
              <span className="flex-1 truncate font-medium">{reviewer.login}</span>
              {reviewer.state === 'APPROVED' && (
                <div 
                  className="bg-emerald-500/10 p-1.5 rounded-md"
                  title={getReviewStateLabel(reviewer.state)} 
                  aria-label={getReviewStateLabel(reviewer.state)}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                </div>
              )}
              {reviewer.state === 'CHANGES_REQUESTED' && (
                <div 
                  className="bg-red-500/10 p-1.5 rounded-md"
                  title={getReviewStateLabel(reviewer.state)} 
                  aria-label={getReviewStateLabel(reviewer.state)}
                >
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" aria-hidden="true" />
                </div>
              )}
              {reviewer.state === 'COMMENTED' && (
                <div 
                  className="bg-blue-500/10 p-1.5 rounded-md"
                  title={getReviewStateLabel(reviewer.state)} 
                  aria-label={getReviewStateLabel(reviewer.state)}
                >
                  <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                </div>
              )}
              {reviewer.state === 'PENDING' && (
                <div 
                  className="bg-muted/50 p-1.5 rounded-md"
                  title={getReviewStateLabel(reviewer.state)} 
                  aria-label={getReviewStateLabel(reviewer.state)}
                >
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
})
