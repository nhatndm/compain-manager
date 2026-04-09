type StatCardProps = {
  label: string
  value: string | number
}

export function StatCard({ label, value }: StatCardProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}
