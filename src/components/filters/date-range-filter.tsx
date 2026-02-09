'use client'

import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const hasValue = value.from || value.to

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 text-xs gap-1.5 px-2',
            hasValue && 'border-primary'
          )}
        >
          <Calendar className="h-3 w-3" />
          <span className="font-medium">Date:</span>
          <span className="text-muted-foreground">
            {hasValue
              ? `${value.from ? format(value.from, 'MMM d') : '...'} - ${value.to ? format(value.to, 'MMM d') : '...'}`
              : 'Any'}
          </span>
          {hasValue && (
            <X
              className="h-3 w-3 ml-0.5"
              onClick={(e) => {
                e.stopPropagation()
                onChange({ from: undefined, to: undefined })
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <CalendarComponent
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={(range) => {
            onChange({
              from: range?.from,
              to: range?.to,
            })
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
