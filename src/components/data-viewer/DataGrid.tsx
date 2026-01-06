'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Columns,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date'
}

interface DataGridProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  title?: string
  exportFilename?: string
}

type SortDirection = 'asc' | 'desc' | null

interface SortState {
  column: string | null
  direction: SortDirection
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 20,
  title,
  exportFilename = 'data-export',
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => String(c.key)))
  )
  const [showFilters, setShowFilters] = useState(false)

  // Format value based on column format
  const formatValue = useCallback((value: any, format?: Column<T>['format']) => {
    if (value === null || value === undefined) return '-'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'percent':
        return `${(value * 100).toFixed(2)}%`
      case 'number':
        return new Intl.NumberFormat('en-US').format(value)
      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      default:
        return String(value)
    }
  }, [])

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Global search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key as keyof T]
          return String(value).toLowerCase().includes(lowerSearch)
        })
      )
    }

    // Column-specific filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        const lowerFilter = filterValue.toLowerCase()
        result = result.filter((row) => {
          const value = row[key as keyof T]
          return String(value).toLowerCase().includes(lowerFilter)
        })
      }
    })

    return result
  }, [data, searchTerm, columnFilters, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortState.column as keyof T]
      const bVal = b[sortState.column as keyof T]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortState.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortState])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sort
  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: 'asc' }
      }
      if (prev.direction === 'asc') {
        return { column: columnKey, direction: 'desc' }
      }
      return { column: null, direction: null }
    })
  }

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(columnKey)) {
        if (next.size > 1) next.delete(columnKey)
      } else {
        next.add(columnKey)
      }
      return next
    })
  }

  // Export to CSV
  const exportToCsv = () => {
    const visibleCols = columns.filter((c) => visibleColumns.has(String(c.key)))
    const headers = visibleCols.map((c) => c.header).join(',')
    const rows = sortedData.map((row) =>
      visibleCols
        .map((col) => {
          const value = row[col.key as keyof T]
          const formatted = formatValue(value, col.format)
          // Escape quotes and wrap in quotes if contains comma
          const stringVal = String(formatted)
          if (stringVal.includes(',') || stringVal.includes('"')) {
            return `"${stringVal.replace(/"/g, '""')}"`
          }
          return stringVal
        })
        .join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${exportFilename}.csv`
    link.click()
  }

  const visibleColumnsList = columns.filter((c) => visibleColumns.has(String(c.key)))

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 w-64"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-primary/10')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-auto">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={String(column.key)}
                  checked={visibleColumns.has(String(column.key))}
                  onCheckedChange={() => toggleColumn(String(column.key))}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Column Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-4 flex flex-wrap gap-3 bg-muted/30">
              {visibleColumnsList
                .filter((c) => c.filterable !== false)
                .map((column) => (
                  <div key={String(column.key)} className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">{column.header}</label>
                    <Input
                      placeholder={`Filter ${column.header}...`}
                      value={columnFilters[String(column.key)] || ''}
                      onChange={(e) => {
                        setColumnFilters((prev) => ({
                          ...prev,
                          [String(column.key)]: e.target.value,
                        }))
                        setCurrentPage(1)
                      }}
                      className="h-8 w-36 text-sm"
                    />
                  </div>
                ))}
              {Object.values(columnFilters).some(Boolean) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end"
                  onClick={() => setColumnFilters({})}
                >
                  Clear all
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/80 backdrop-blur-sm">
              {visibleColumnsList.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-left font-semibold text-muted-foreground border-b border-border',
                    'first:rounded-tl-lg last:rounded-tr-lg',
                    column.sortable !== false && 'cursor-pointer select-none hover:bg-accent/50'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable !== false && (
                      <span className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3 -mb-1',
                            sortState.column === String(column.key) &&
                              sortState.direction === 'asc'
                              ? 'text-primary'
                              : 'text-muted-foreground/40'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3',
                            sortState.column === String(column.key) &&
                              sortState.direction === 'desc'
                              ? 'text-primary'
                              : 'text-muted-foreground/40'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumnsList.length}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  className={cn(
                    'border-b border-border hover:bg-accent/30 transition-colors',
                    rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                  )}
                >
                  {visibleColumnsList.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3">
                      {column.render
                        ? column.render(row[column.key as keyof T], row)
                        : formatValue(row[column.key as keyof T], column.format)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize + 1).toLocaleString()} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length).toLocaleString()} of{' '}
          {sortedData.length.toLocaleString()} entries
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-8"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
