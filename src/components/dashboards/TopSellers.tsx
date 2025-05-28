import { useState, useEffect } from 'react';

interface SellerDelivery {
  seller_id: number;
  seller_name: string;
  total_quantity: number;
  total_value: number;
  delivery_breakdown: {
    quantity: Record<string, number>;
    value: Record<string, number>;
  };
}

interface TopSellersResponse {
  period: string;
  sellers: SellerDelivery[];
}

export default function TopSellers() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<TopSellersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopSellers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/admin/top-sellers/?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch top sellers');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load top sellers');
      } finally {
        setLoading(false);
      }
    };
    fetchTopSellers();
  }, [period]);

  // Collect all unique period keys for columns
  const allPeriods = Array.from(
    new Set(
      data?.sellers.flatMap(s => [
        ...Object.keys(s.delivery_breakdown.quantity),
        ...Object.keys(s.delivery_breakdown.value)
      ]) || []
    )
  ).sort();

  return (
    <div className="mt-8">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold mr-4">Top Sellers</h2>
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
        <div className="text-center p-6">Loading top sellers...</div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">{error}</div>
      ) : !data || !data.sellers.length ? (
        <div className="text-center p-6">No top sellers data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Seller</th>
                <th className="border px-2 py-1">Total Qty</th>
                <th className="border px-2 py-1">Total Value</th>
                {allPeriods.map(periodKey => (
                  <th key={periodKey + '-qty'} className="border px-2 py-1">Qty {periodKey}</th>
                ))}
                {allPeriods.map(periodKey => (
                  <th key={periodKey + '-val'} className="border px-2 py-1">Value {periodKey}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sellers.map(seller => (
                <tr key={seller.seller_id}>
                  <td className="border px-2 py-1 font-medium">{seller.seller_name}</td>
                  <td className="border px-2 py-1 text-right">{seller.total_quantity}</td>
                  <td className="border px-2 py-1 text-right">₹{seller.total_value.toLocaleString()}</td>
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-qty'} className="border px-2 py-1 text-right">
                      {seller.delivery_breakdown.quantity[periodKey] !== undefined ? seller.delivery_breakdown.quantity[periodKey] : '-'}
                    </td>
                  ))}
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-val'} className="border px-2 py-1 text-right">
                      {seller.delivery_breakdown.value[periodKey] !== undefined ? `₹${seller.delivery_breakdown.value[periodKey].toLocaleString()}` : '-'}
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