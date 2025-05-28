import { useState, useEffect } from 'react';
import { ChartContainer } from '@/components/ui/chart';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

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

interface ProductMovementChartProps {
  chartOnly?: boolean;
  tableOnly?: boolean;
}

// Color palette for bars
const COLORS = [
  '#2563eb', '#10b981', '#f59e42', '#ef4444', '#a21caf', '#eab308', '#0ea5e9', '#14b8a6', '#f43f5e', '#6366f1',
];

export default function ProductMovementChart({ chartOnly = false, tableOnly = false }: ProductMovementChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<ProductMovementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yType, setYType] = useState<'quantity' | 'value'>('quantity');

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

  // Prepare chart data
  const chartData = (data?.products || []).map(p => ({
    name: p.product_name,
    quantity: p.total_quantity,
    value: p.total_value,
  }));

  // For multi-color bars: one bar per product for 'quantity', single bar for 'value'
  const isQuantity = yType === 'quantity';

  // For quantity: group by period, each product is a bar
  let chartDataTransformed: { name: string; quantity: number; value: number }[] | { period: string; [product: string]: number | string }[] = chartData;
  if (isQuantity && data) {
    // Build data: [{ period: '2025-20', ProductA: 10, ProductB: 20, ... }, ...]
    const periodSet = new Set<string>();
    data.products.forEach(p => Object.keys(p.movement_breakdown.quantity).forEach(period => periodSet.add(period)));
    const periods = Array.from(periodSet).sort();
    chartDataTransformed = periods.map(period => {
      const entry: { period: string; [product: string]: number | string } = { period };
      data.products.forEach(p => {
        entry[p.product_name] = p.movement_breakdown.quantity[period] ?? 0;
      });
      return entry;
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center mb-2 gap-4">
        <h2 className="text-lg font-semibold">Product Movement</h2>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={period}
          onChange={e => setPeriod(e.target.value as 'week' | 'month')}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button
            className={`px-3 py-1 rounded border text-sm ${yType === 'quantity' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setYType('quantity')}
          >
            Quantity
          </button>
          <button
            className={`px-3 py-1 rounded border text-sm ${yType === 'value' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setYType('value')}
          >
            Value
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center p-6">Loading product movement data...</div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">{error}</div>
      ) : !data || !data.products.length ? (
        <div className="text-center p-6">No product movement data available</div>
      ) : (
        <>
          {/* Bar Chart */}
          {!tableOnly && (
            <div className="w-full h-80 mb-6">
              <ChartContainer config={{}}>
                <ReBarChart data={chartDataTransformed} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {isQuantity ? (
                    <XAxis dataKey="period" />
                  ) : (
                    <XAxis dataKey="name" />
                  )}
                  <YAxis />
                  <Tooltip formatter={(value: number) => yType === 'value' ? `₹${Number(value).toLocaleString()}` : value} />
                  <Legend />
                  {isQuantity && data
                    ? data.products.map((p, idx) => (
                        <Bar
                          key={p.product_id}
                          dataKey={p.product_name}
                          name={p.product_name}
                          fill={COLORS[idx % COLORS.length]}
                          isAnimationActive={false}
                        />
                      ))
                    : <Bar dataKey={yType} fill="#2563eb" name={yType === 'quantity' ? 'Quantity' : 'Value'} />
                  }
                </ReBarChart>
              </ChartContainer>
            </div>
          )}
          {/* Table */}
          {!chartOnly && (
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
        </>
      )}
    </div>
  );
} 