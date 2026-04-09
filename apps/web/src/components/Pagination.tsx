type PaginationProps = {
  page: number
  totalPages: number
  total: number
  label?: string
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, label = 'items', onPageChange }: PaginationProps): JSX.Element | null {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm text-gray-400">
      <span>{total} {label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-700 px-3 py-1.5 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-gray-500">{page} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-700 px-3 py-1.5 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
