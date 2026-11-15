import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface WeeklyConsistencyPoint {
  weekKey: string;
  label: string;
  rangeLabel: string;
  completedCount: number;
  scheduledCount: number;
  percentage: number;
}

export interface DailyWeekPoint {
  date: string;
  label: string;
  shortNum: string;
  completedCount: number;
  scheduledCount: number;
  percentage: number;
}

interface CustomTooltipPayloadItem<T> {
  payload: T;
}

function ConsistencyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem<WeeklyConsistencyPoint>[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] px-3.5 py-2.5 shadow-xl text-xs">
      <div className="font-medium text-[var(--toka-text-primary)]">{item.rangeLabel}</div>
      <div className="mt-1 font-mono-num text-sm font-semibold text-[var(--toka-accent-text)]">
        {item.percentage}% completion
      </div>
      <div className="mt-0.5 font-mono-num text-[var(--toka-text-secondary)]">
        {item.completedCount} / {item.scheduledCount} scheduled
      </div>
    </div>
  );
}

function DailyBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem<DailyWeekPoint>[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] px-3.5 py-2.5 shadow-xl text-xs">
      <div className="font-medium text-[var(--toka-text-primary)]">
        {item.label} · {item.date}
      </div>
      <div className="mt-1 font-mono-num text-sm font-semibold text-[var(--toka-accent-text)]">
        {item.percentage}%
      </div>
      <div className="mt-0.5 font-mono-num text-[var(--toka-text-secondary)]">
        {item.completedCount} / {item.scheduledCount} completed
      </div>
    </div>
  );
}

export function WeeklyConsistencyOverTimeChart({
  data,
  averageRate,
}: {
  data: WeeklyConsistencyPoint[];
  averageRate: number;
}) {
  return (
    <div className="w-full h-[210px]" role="img" aria-label="Weekly completion rate over time chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="tokaLimeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C6FF69" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#C6FF69" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--toka-border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--toka-text-secondary)', fontSize: 11 }}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: 'var(--toka-text-secondary)', fontSize: 11 }}
          />
          <Tooltip content={<ConsistencyTooltip />} cursor={{ stroke: 'var(--toka-border)' }} />
          {averageRate > 0 ? (
            <ReferenceLine
              y={averageRate}
              stroke="var(--toka-text-secondary)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="#C6FF69"
            strokeWidth={2.5}
            fill="url(#tokaLimeFill)"
            activeDot={{ r: 5, fill: '#C6FF69', stroke: '#121512', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Last7DaysRechartsBar({ data }: { data: DailyWeekPoint[] }) {
  return (
    <div className="w-full h-[210px]" role="img" aria-label="Last 7 days completion rate bar chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--toka-border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--toka-text-secondary)', fontSize: 11 }}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: 'var(--toka-text-secondary)', fontSize: 11 }}
          />
          <Tooltip
            content={<DailyBarTooltip />}
            cursor={{ fill: 'var(--toka-bg-secondary)', opacity: 0.45 }}
          />
          <Bar dataKey="percentage" radius={[8, 8, 4, 4]} maxBarSize={36}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.percentage === 100
                    ? '#C6FF69'
                    : entry.percentage > 0
                    ? 'rgba(198, 255, 105, 0.6)'
                    : 'var(--toka-border)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
