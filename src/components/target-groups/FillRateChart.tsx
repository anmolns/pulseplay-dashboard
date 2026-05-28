'use client'

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

  const isEmpty = !isLoading && !isError && chartData.length === 0

  return (
    <Card className="border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base text-foreground">Fill Rate</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[280px] w-full" />}
        {isError && (
          <p className="py-12 text-center text-sm text-red-400">
            Failed to load fill rate data.
          </p>
        )}
        {isEmpty && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No data yet
          </p>
        )}
        {!isLoading && !isError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                labelFormatter={(label) => String(label)}
              />
              <Legend />
              {completesGoal != null && completesGoal > 0 && (
                <ReferenceLine
                  yAxisId="right"
                  y={completesGoal}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="6 4"
                  label={{
                    value: `Goal: ${completesGoal}`,
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
              )}
              <Bar
                yAxisId="left"
                dataKey="completes_count"
                name="Daily completes"
                fill="hsl(var(--primary))"
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative_completes"
                name="Cumulative completes"
                stroke="hsl(221, 83%, 55%)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(221, 83%, 55%)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
