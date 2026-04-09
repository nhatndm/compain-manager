type DonutChartProps = {
  label: string
  value: number
  color: string
}

export function DonutChart({ label, value, color }: DonutChartProps): JSX.Element {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const filled = (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-sm font-medium text-gray-400">{label}</h2>
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="absolute text-lg font-bold text-white">{value.toFixed(1)}%</span>
      </div>
    </div>
  )
}
