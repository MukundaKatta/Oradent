'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MonthData {
  month: string;
  production: number;
  collections: number;
}

const MOCK_DATA: MonthData[] = [
  { month: 'Jan', production: 142000, collections: 128000 },
  { month: 'Feb', production: 155000, collections: 139000 },
  { month: 'Mar', production: 148000, collections: 145000 },
  { month: 'Apr', production: 167000, collections: 152000 },
  { month: 'May', production: 172000, collections: 161000 },
  { month: 'Jun', production: 180000, collections: 168000 },
];

function formatCurrencyTick(value: number): string {
  return `$${(value / 1000).toFixed(0)}k`;
}

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-stone-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-stone-600 capitalize">{entry.name}:</span>
          <span className="text-sm font-semibold text-stone-900">
            {formatter.format(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Revenue Trend</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#78716c' }}
              axisLine={{ stroke: '#d6d3d1' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrencyTick}
              tick={{ fontSize: 12, fill: '#78716c' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs capitalize text-stone-600">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="production"
              name="production"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="collections"
              name="collections"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { RevenueChart };
