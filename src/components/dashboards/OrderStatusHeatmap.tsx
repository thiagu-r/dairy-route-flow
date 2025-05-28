import { useState, useEffect } from 'react';

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

export default function OrderStatusHeatmap() {
  const [data, setData] = useState<null | {
    date: string;
    statuses: string[];
    heatmap: Array<{
      route: string;
      [status: string]: string | number;
    }>;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const date = getTodayDateString();
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/admin/order-status-heatmap/?date=${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch order status heatmap');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load heatmap');
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  if (loading) return <div className="text-center p-6">Loading order status heatmap...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (!data) return <div className="text-center p-6">No heatmap data available</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Order Status Heatmap ({data.date})</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Route</th>
              {data.statuses.map(status => (
                <th key={status} className="border px-2 py-1 capitalize">{status.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.heatmap.map((row, i) => (
              <tr key={row.route + i}>
                <td className="border px-2 py-1 font-medium">{row.route}</td>
                {data.statuses.map(status => (
                  <td key={status} className="border px-2 py-1 text-center">{row[status]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 