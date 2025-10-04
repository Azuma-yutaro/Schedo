"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatDate } from "@/lib/utils/date"

type ResultsChartProps = {
  data: Array<{
    date: string
    dateId: string
    available: number
    maybe: number
    unavailable: number
    total: number
  }>
}

export function ResultsChart({ data }: ResultsChartProps) {
  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    参加可能: item.available,
    条件付き: item.maybe,
    参加不可: item.unavailable,
  }))

  const chartConfig = {
    参加可能: {
      label: "参加可能",
      color: "hsl(142, 76%, 36%)",
    },
    条件付き: {
      label: "条件付き",
      color: "hsl(48, 96%, 53%)",
    },
    参加不可: {
      label: "参加不可",
      color: "hsl(0, 84%, 60%)",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} fontSize={12} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="参加可能" fill="var(--color-参加可能)" stackId="a" />
          <Bar dataKey="条件付き" fill="var(--color-条件付き)" stackId="a" />
          <Bar dataKey="参加不可" fill="var(--color-参加不可)" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
