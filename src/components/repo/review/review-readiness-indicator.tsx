import { Circle, CircleDashed, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRReviewStatus, PRReviewProgress } from '@/lib/review-progress'

interface ReviewReadinessIndicatorProps {
  status: PRReviewStatus
  progress: PRReviewProgress
}

export function ReviewReadinessIndicator({ 
  status, 
  progress 
}: ReviewReadinessIndicatorProps) {
  const config: Record<PRReviewStatus, any> = {
    not_started: {
      icon: Circle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      label: 'Not started',
      ariaLabel: 'Review not started'
    },
    in_review: {
      icon: CircleDashed,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      label: `In review (${progress.filesReviewed}/${progress.filesTotal})`,
      ariaLabel: `Review in progress: ${progress.filesReviewed} of ${progress.filesTotal} files reviewed`
    },
    in_progress: {
      icon: CircleDashed,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      label: `In review (${progress.filesReviewed}/${progress.filesTotal})`,
      ariaLabel: `Review in progress: ${progress.filesReviewed} of ${progress.filesTotal} files reviewed`
    },
    complete: {
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      label: 'Review complete',
      ariaLabel: 'Review complete'
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      label: 'Review complete',
      ariaLabel: 'Review complete'
    }
  }
  
  const { icon: Icon, color, bgColor, label, ariaLabel } = config[status] || config.not_started
  
  return (
    <div 
      className="flex items-center gap-2" 
      role="status"
      aria-label={ariaLabel}
    >
      <div className={cn('p-1.5 rounded-full', bgColor)}>
        <Icon className={cn('h-3.5 w-3.5', color)} aria-hidden="true" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
