'use client'

import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
  className?: string
  filterButton?: React.ReactNode
  hasActiveFilters?: boolean
}

export function FilterBar({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  children,
  className,
  filterButton,
  hasActiveFilters = false,
}: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-2 p-2 border-b border-border/50 bg-muted/20', className)}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 pl-8 pr-8 text-xs bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-colors"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/80 rounded-sm"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Button (Popover trigger) */}
      {filterButton}

      {/* Filter Dropdowns */}
      {children && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
