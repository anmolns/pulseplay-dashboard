'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatChartDate } from '@/lib/utils'
import type { FillRateEntry } from '@/types'

interface FillRateChartProps {
  data?: FillRateEntry[]
  completesGoal?: number
  isLoading: boolean
  isError: boolean
}

export function FillRateChart({
  data,
  completesGoal,
  isLoading,
  isError,
}: FillRateChartProps) {
  const chartData =
    data?.map((d) => ({
      ...d,
      label: formatChartDate(d.date),
    })) ?? []

  return (
    <Card className="border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base text-[hsl(276,45%,28%)]">Fill Rate</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[280px] w-full" />}
        {isError && (
          <p className="py-12 text-center text-sm text-red-600">
            Failed to load fill rate data.
          </p>
        )}
        {!isLoading && !isError && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [value ?? 0, 'Cumulative completes']}
                labelFormatter={(label) => String(label)}
              />
              {completesGoal != null && completesGoal > 0 && (
                <ReferenceLine
                  y={completesGoal}
                  stroke="#94a3b8"
                  strokeDasharray="6 4"
                  label={{
                    value: `Goal: ${completesGoal}`,
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="cumulative_completes"
                stroke="hsl(276, 65%, 42%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
