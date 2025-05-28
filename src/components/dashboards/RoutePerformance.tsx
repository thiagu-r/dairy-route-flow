import { useState, useEffect } from 'react';

interface RoutePerformanceData {
  route_id: number;
  route_name: string;
  total_deliveries: number;
  on_time_deliveries: number;
  on_time_percent: number;
  total_delivered_quantity: number;
  performance_breakdown: Record<string, {
    total_deliveries: number;
    on_time_deliveries: number;
    total_delivered_quantity: number;
  }>;
}

interface RoutePerformanceResponse {
  period: string;
  routes: RoutePerformanceData[];
}

export default function RoutePerformance() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<RoutePerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/admin/route-performance/?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch route performance');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load route performance');
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [period]);

  // Collect all unique period keys for columns
  const allPeriods = Array.from(
    new Set(
      data?.routes.flatMap(r => Object.keys(r.performance_breakdown)) || []
    )
  ).sort();

  return (
    <div className="mt-8">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold mr-4">Route Performance</h2>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={period}
          onChange={e => setPeriod(e.target.value as 'week' | 'month')}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      {loading ? (
        <div className="text-center p-6">Loading route performance...</div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">{error}</div>
      ) : !data || !data.routes.length ? (
        <div className="text-center p-6">No route performance data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Route</th>
                <th className="border px-2 py-1">Total Deliveries</th>
                <th className="border px-2 py-1">On-Time Deliveries</th>
                <th className="border px-2 py-1">On-Time %</th>
                <th className="border px-2 py-1">Total Delivered Qty</th>
                {allPeriods.map(periodKey => (
                  <th key={periodKey + '-td'} className="border px-2 py-1">TD {periodKey}</th>
                ))}
                {allPeriods.map(periodKey => (
                  <th key={periodKey + '-otd'} className="border px-2 py-1">OTD {periodKey}</th>
                ))}
                {allPeriods.map(periodKey => (
                  <th key={periodKey + '-qty'} className="border px-2 py-1">Qty {periodKey}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.routes.map(route => (
                <tr key={route.route_id}>
                  <td className="border px-2 py-1 font-medium">{route.route_name}</td>
                  <td className="border px-2 py-1 text-right">{route.total_deliveries}</td>
                  <td className="border px-2 py-1 text-right">{route.on_time_deliveries}</td>
                  <td className="border px-2 py-1 text-right">{route.on_time_percent.toFixed(2)}%</td>
                  <td className="border px-2 py-1 text-right">{route.total_delivered_quantity}</td>
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-td'} className="border px-2 py-1 text-right">
                      {route.performance_breakdown[periodKey]?.total_deliveries ?? '-'}
                    </td>
                  ))}
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-otd'} className="border px-2 py-1 text-right">
                      {route.performance_breakdown[periodKey]?.on_time_deliveries ?? '-'}
                    </td>
                  ))}
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-qty'} className="border px-2 py-1 text-right">
                      {route.performance_breakdown[periodKey]?.total_delivered_quantity ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 