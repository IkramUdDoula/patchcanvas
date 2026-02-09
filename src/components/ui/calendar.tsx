'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns'

export interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | { from: Date | undefined; to: Date | undefined }
  onSelect?: (date: any) => void
  numberOfMonths?: number
  className?: string
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  numberOfMonths = 1,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const months = React.useMemo(() => {
    return Array.from({ length: numberOfMonths }, (_, i) =>
      addMonths(currentMonth, i)
    )
  }, [currentMonth, numberOfMonths])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleDayClick = (day: Date) => {
    if (mode === 'single') {
      onSelect?.(day)
    } else if (mode === 'range') {
      const range = selected as { from: Date | undefined; to: Date | undefined }
      if (!range?.from || (range.from && range.to)) {
        onSelect?.({ from: day, to: undefined })
      } else {
        if (day < range.from) {
          onSelect?.({ from: day, to: range.from })
        } else {
          onSelect?.({ from: range.from, to: day })
        }
      }
    }
  }

  const isDaySelected = (day: Date) => {
    if (mode === 'single') {
      return selected && isSameDay(day, selected as Date)
    } else if (mode === 'range') {
      const range = selected as { from: Date | undefined; to: Date | undefined }
      if (range?.from && range?.to) {
        return isWithinInterval(day, { start: range.from, end: range.to })
      }
      return range?.from && isSameDay(day, range.from)
    }
    return false
  }

  const isRangeStart = (day: Date) => {
    if (mode === 'range') {
      const range = selected as { from: Date | undefined; to: Date | undefined }
      return range?.from && isSameDay(day, range.from)
    }
    return false
  }

  const isRangeEnd = (day: Date) => {
    if (mode === 'range') {
      const range = selected as { from: Date | undefined; to: Date | undefined }
      return range?.to && isSameDay(day, range.to)
    }
    return false
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="flex gap-4">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              {monthIndex === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div
                className={cn(
                  'text-sm font-semibold',
                  monthIndex !== 0 && 'ml-auto'
                )}
              >
                {format(month, 'MMMM yyyy')}
              </div>
              {monthIndex === numberOfMonths - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-muted-foreground text-center py-1"
                >
                  {day}
                </div>
              ))}

              {/* Days */}
              {(() => {
                const start = startOfWeek(startOfMonth(month))
                const end = endOfWeek(endOfMonth(month))
                const days = eachDayOfInterval({ start, end })

                return days.map((day, dayIndex) => {
                  const isCurrentMonth = isSameMonth(day, month)
                  const isSelected = isDaySelected(day)
                  const isStart = isRangeStart(day)
                  const isEnd = isRangeEnd(day)

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => handleDayClick(day)}
                      disabled={!isCurrentMonth}
                      className={cn(
                        'h-8 w-8 text-xs rounded-md transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        'disabled:opacity-30 disabled:cursor-not-allowed',
                        isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                        (isStart || isEnd) && 'font-semibold',
                        !isCurrentMonth && 'text-muted-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
