import { memo } from 'react'
import { cn } from '@/lib/utils'
import { PRCostLevel, PRRiskLevel } from '@/lib/pr-intelligence'

interface ReviewCostIndicatorProps {
  cost: PRCostLevel
  filesChanged?: number
  linesChanged?: number
  commits?: number
  className?: string
}

const costConfig: Record<PRCostLevel, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
  high: {
    label: 'High',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  'very-high': {
    label: 'Very High',
    className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
  },
}

export const ReviewCostIndicator = memo(function ReviewCostIndicator({
  cost,
  className,
}: ReviewCostIndicatorProps) {
  const config = costConfig[cost]

  // No tooltips as per requirements - all review intelligence lives in the PR details panel
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
})

// Risk badge with appropriate visual weight
export function RiskBadge({ level }: { level: PRRiskLevel }) {
  const config = {
    low: { 
      label: 'LOW RISK', 
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
    },
    medium: { 
      label: 'MEIDUM RISK', 
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' 
    },
    high: { 
      label: 'HIGH RISK', 
      className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' 
    }
  }
  
  const { label, className } = config[level]
  
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide', className)}>
      {label}
    </span>
  )
}

// Risk signal - neutral styling, no severity indicators
export function RiskSignalItem({ description }: { description: string }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="text-muted-foreground mt-1">•</span>
      <span className="text-muted-foreground">{description}</span>
    </li>
  )
}
