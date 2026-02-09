import { FileText } from 'lucide-react'
import { PREffortMetrics } from '@/lib/effort-metrics'

interface EffortSignalProps {
  metrics: PREffortMetrics
}

export function EffortSignal({ metrics }: EffortSignalProps) {
  if (!metrics.largestChange) {
    return null
  }
  
  return (
    <div 
      className="flex items-center gap-3 text-xs text-muted-foreground"
      role="status"
      aria-label={`${metrics.filesNeedingAttention} files need attention, largest change has ${metrics.largestChange.additions} additions and ${metrics.largestChange.deletions} deletions`}
    >
      {metrics.filesNeedingAttention > 0 && (
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" aria-hidden="true" />
          <span>
            {metrics.filesNeedingAttention} {metrics.filesNeedingAttention === 1 ? 'file' : 'files'} need attention
          </span>
        </span>
      )}
      <span className="flex items-center gap-1">
        <span className="text-emerald-600 dark:text-emerald-400">
          +{metrics.largestChange.additions}
        </span>
        <span className="text-red-600 dark:text-red-400">
          -{metrics.largestChange.deletions}
        </span>
        <span className="text-muted-foreground/70">largest change</span>
      </span>
    </div>
  )
}
