'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint } from './actions'

interface Props {
  data: ChartDataPoint[]
}

function formatTRY(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(Math.round(value)) + ' ₺'
}

export default function CotisationsChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-5 flex items-center gap-2">
        <span>📊</span> Cotisations — 6 derniers mois
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            tickFormatter={(v: number) => `${v} ₺`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            width={72}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === 'number' ? formatTRY(value) : String(value),
              name === 'du' ? 'Montant dû' : 'Montant payé',
            ]}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'du' ? 'Montant dû' : 'Montant payé'
            }
          />
          <Bar
            dataKey="du"
            name="du"
            fill="#c9a84c"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="paye"
            name="paye"
            fill="#00b4d8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
