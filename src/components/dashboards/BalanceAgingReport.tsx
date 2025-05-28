import { useState, useEffect } from 'react';

interface SellerAging {
  seller_id: number;
  seller_name: string;
  total_balance: number;
  overdue_breakdown: Record<string, number>;
}

interface AgingResponse {
  period: string;
  sellers: SellerAging[];
}

export default function BalanceAgingReport() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<AgingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAging = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/admin/balance-aging/?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch balance aging report');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load balance aging report');
      } finally {
        setLoading(false);
      }
    };
    fetchAging();
  }, [period]);

  return (
    <div className="mt-8">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold mr-4">Balance Aging Report</h2>
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
        <div className="text-center p-6">Loading balance aging report...</div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">{error}</div>
      ) : !data || !data.sellers.length ? (
        <div className="text-center p-6">No balance aging data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Seller</th>
                <th className="border px-2 py-1">Total Balance</th>
                {/** Dynamically render all unique overdue periods as columns */}
                {Array.from(
                  new Set(
                    data.sellers.flatMap(s => Object.keys(s.overdue_breakdown))
                  )
                ).sort().map(periodKey => (
                  <th key={periodKey} className="border px-2 py-1">{periodKey}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sellers.map(seller => (
                <tr key={seller.seller_id}>
                  <td className="border px-2 py-1 font-medium">{seller.seller_name}</td>
                  <td className="border px-2 py-1 text-right">₹{seller.total_balance.toLocaleString()}</td>
                  {Array.from(
                    new Set(
                      data.sellers.flatMap(s => Object.keys(s.overdue_breakdown))
                    )
                  ).sort().map(periodKey => (
                    <td key={periodKey} className="border px-2 py-1 text-right">
                      {seller.overdue_breakdown[periodKey] ? `₹${seller.overdue_breakdown[periodKey].toLocaleString()}` : '-'}
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