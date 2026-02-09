'use client'

import { memo, useMemo } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { CheckRun } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface PRChecksPanelProps {
  checks: CheckRun[]
  loading?: boolean
}

export const PRChecksPanel = memo(function PRChecksPanel({ checks, loading }: PRChecksPanelProps) {
  const checksSummary = useMemo(() => {
    const total = checks.length
    const success = checks.filter(c => c.conclusion === 'success').length
    const failure = checks.filter(c => c.conclusion === 'failure').length
    const inProgress = checks.filter(c => c.status === 'in_progress').length
    return { total, success, failure, inProgress }
  }, [checks])

  if (loading) {
    return (
      <Card className="p-5 space-y-4 card-elevated">
        <h3 className="font-semibold text-base">Checks</h3>
        <div className="space-y-3" role="status" aria-label="Loading checks">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (checks.length === 0) {
    return (
      <Card className="p-5 card-elevated">
        <h3 className="font-semibold text-base mb-3">Checks</h3>
        <p className="text-sm text-muted-foreground">No checks configured</p>
      </Card>
    )
  }

  return (
    <Card className="p-5 space-y-4 card-elevated">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Checks</h3>
        <div className="flex items-center gap-2">
          {checksSummary.success === checksSummary.total ? (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5" aria-label="All checks passed">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All passed
            </span>
          ) : checksSummary.failure > 0 ? (
            <span className="text-xs font-medium text-red-600 flex items-center gap-1.5" aria-label={`${checksSummary.failure} checks failed`}>
              <XCircle className="h-3.5 w-3.5" />
              {checksSummary.failure} failed
            </span>
          ) : checksSummary.inProgress > 0 ? (
            <span className="text-xs font-medium text-yellow-600 flex items-center gap-1.5" aria-label={`${checksSummary.inProgress} checks in progress`}>
              <Clock className="h-3.5 w-3.5" />
              {checksSummary.inProgress} running
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">{checksSummary.total} total</span>
        </div>
      </div>
      <nav aria-label="Check runs">
        <ul className="space-y-1">
          {checks.map((check) => (
            <li key={check.id}>
              <a
                href={check.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:bg-muted/50 p-3 rounded-md transition-colors group focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`${check.name}: ${check.status === 'completed' ? check.conclusion : check.status}`}
              >
                {check.status === 'completed' && check.conclusion === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                )}
                {check.status === 'completed' && check.conclusion === 'failure' && (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" aria-hidden="true" />
                )}
                {check.status === 'in_progress' && (
                  <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 animate-pulse" aria-hidden="true" />
                )}
                {check.status === 'queued' && (
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                )}
                <span className="flex-1 truncate font-medium">{check.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  )
})
