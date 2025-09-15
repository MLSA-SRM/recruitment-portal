'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PaginationControlsProps {
  page: number
  totalPages: number
  total: number
  limit: number
  searchParams: Record<string, string>
}

export function PaginationControls({ 
  page, 
  totalPages, 
  total, 
  limit, 
  searchParams 
}: PaginationControlsProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const pathname = usePathname()

  const handlePageSizeChange = (newLimit: string) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    params.set('limit', newLimit)
    params.set('page', '1') // Reset to first page when changing page size
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-6 px-4">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-700">
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show:</span>
          <select 
            value={limit.toString()} 
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
          <span className="text-sm text-gray-700">per page</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {page > 1 && (
          <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}>
            <Button variant="outline" size="sm">Previous</Button>
          </Link>
        )}
        
        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {(() => {
            const pages = []
            const maxVisiblePages = 5
            const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
            
            // Show first page if not visible
            if (startPage > 1) {
              pages.push(
                <Link key={1} href={`${pathname}?${new URLSearchParams({ ...searchParams, page: '1' }).toString()}`}>
                  <Button variant={page === 1 ? "default" : "outline"} size="sm">1</Button>
                </Link>
              )
              if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="text-gray-500">...</span>)
              }
            }
            
            // Show visible pages
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <Link key={i} href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(i) }).toString()}`}>
                  <Button variant={page === i ? "default" : "outline"} size="sm">{i}</Button>
                </Link>
              )
            }
            
            // Show last page if not visible
            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="text-gray-500">...</span>)
              }
              pages.push(
                <Link key={totalPages} href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(totalPages) }).toString()}`}>
                  <Button variant={page === totalPages ? "default" : "outline"} size="sm">{totalPages}</Button>
                </Link>
              )
            }
            
            return pages
          })()}
        </div>
        
        {page < totalPages && (
          <Link href={`${pathname}?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}>
            <Button variant="outline" size="sm">Next</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

