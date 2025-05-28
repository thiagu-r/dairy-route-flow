import { useState, useEffect } from 'react';

interface ProductMovement {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_value: number;
  movement_breakdown: {
    quantity: Record<string, number>;
    value: Record<string, number>;
  };
}

interface ProductMovementResponse {
  period: string;
  products: ProductMovement[];
}

export default function ProductMovementChart() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<ProductMovementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovement = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/admin/product-movement/?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch product movement data');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load product movement data');
      } finally {
        setLoading(false);
      }
    };
    fetchMovement();
  }, [period]);

  // Collect all unique period keys for columns
  const allPeriods = Array.from(
    new Set(
      data?.products.flatMap(p => [
        ...Object.keys(p.movement_breakdown.quantity),
        ...Object.keys(p.movement_breakdown.value)
      ]) || []
    )
  ).sort();

  return (
    <div className="mt-8">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold mr-4">Product Movement</h2>
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
        <div className="text-center p-6">Loading product movement data...</div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">{error}</div>
      ) : !data || !data.products.length ? (
        <div className="text-center p-6">No product movement data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Product</th>
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
              {data.products.map(product => (
                <tr key={product.product_id}>
                  <td className="border px-2 py-1 font-medium">{product.product_name}</td>
                  <td className="border px-2 py-1 text-right">{product.total_quantity}</td>
                  <td className="border px-2 py-1 text-right">₹{product.total_value.toLocaleString()}</td>
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-qty'} className="border px-2 py-1 text-right">
                      {product.movement_breakdown.quantity[periodKey] !== undefined ? product.movement_breakdown.quantity[periodKey] : '-'}
                    </td>
                  ))}
                  {allPeriods.map(periodKey => (
                    <td key={periodKey + '-val'} className="border px-2 py-1 text-right">
                      {product.movement_breakdown.value[periodKey] !== undefined ? `₹${product.movement_breakdown.value[periodKey].toLocaleString()}` : '-'}
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