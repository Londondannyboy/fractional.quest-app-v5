'use client'

interface ChartDataPoint {
  label: string
  value: number
}

interface A2UIChartProps {
  type: 'bar' | 'line' | 'pie'
  title: string
  data: ChartDataPoint[]
  xLabel?: string
  yLabel?: string
}

export function A2UIChart({ type, title, data, xLabel, yLabel }: A2UIChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value))

  // Simple bar chart implementation
  if (type === 'bar') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600 truncate" title={item.label}>
                {item.label}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(xLabel || yLabel) && (
          <div className="mt-4 flex justify-between text-xs text-gray-400">
            {yLabel && <span>{yLabel}</span>}
            {xLabel && <span>{xLabel}</span>}
          </div>
        )}
      </div>
    )
  }

  // Simple pie chart implementation (using CSS)
  if (type === 'pie') {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const colors = [
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-blue-500',
      'bg-cyan-500',
      'bg-teal-500',
    ]

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="flex items-center gap-6">
          {/* Simple visual representation */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{total}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-medium text-gray-900 ml-auto">
                  {item.value} ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Fallback to bar chart for unsupported types
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-500 text-sm">Chart type &quot;{type}&quot; is not yet supported.</p>
    </div>
  )
}
